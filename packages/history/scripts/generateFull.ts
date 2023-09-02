import { versions } from "@arethetypeswrong/core/versions";
import cliProgress from "cli-progress";
import { appendFileSync, createReadStream, createWriteStream } from "fs";
import { open, readFile, rename, stat, unlink, writeFile } from "fs/promises";
import { createRequire } from "module";
import fetch from "node-fetch";
import { npmHighImpact } from "npm-high-impact";
import os from "os";
import pacote from "pacote";
import { major, minor } from "semver";
import ts from "typescript";
import { createGzip } from "zlib";
import checkPackages from "./checkPackages.ts";
import { downloadData, uploadData } from "./storage.ts";
import type { DatesJson, FullJsonLine } from "./types.ts";

process.on("SIGINT", () => {
  process.exit(1);
});

const excludePackages = [
  "grunt-ts", // File not found: /node_modules/grunt-ts/defs/tsd.d.ts
  "Babel", // Expected double-quoted property name in JSON at position 450
  "aws-cdk-lib", // Takes forever
];

const excludedSpecs = [
  "next@12.2.0", // File not found: /node_modules/next/dist/styled-jsx-types/global.ts
  "moment@2.29.1", // Invalid gzip data
  "moment@2.29.3", // Invalid gzip data
];

// Array of month starts from 2022-01-01 until the first of this month
const startYear = 2022;
const dates = Array.from(
  { length: 12 * (new Date().getFullYear() - startYear) + new Date().getMonth() + 1 },
  (_, i) => {
    const month = String((i % 12) + 1).padStart(2, "0");
    const year = String(Math.floor(i / 12) + startYear);
    return `${year}-${month}-01`;
  }
);

let datesModified = false;
let fullModified = false;
const npmHighImpactVersion = createRequire(import.meta.url)("npm-high-impact/package.json").version;
const outJsonFileName = new URL("../data/out.json", import.meta.url);
try {
  await unlink(outJsonFileName);
} catch {}

const fullJsonFileName = new URL("../data/full.json", import.meta.url);
const datesFileName = new URL("../data/dates.json", import.meta.url);
await downloadData();
const existingDates: DatesJson = JSON.parse(await readFile(datesFileName, "utf8"));

const typesRegistry: { entries: Record<string, Record<string, string>> } = createRequire(import.meta.url)(
  "types-registry/index.json"
);
const notNeededPackages: { packages: Record<string, { asOfVersion: string }> } = (await fetch(
  "https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/notNeededPackages.json"
).then((r) => r.json())) as any;
const typesPackages = new Set([...Object.keys(typesRegistry.entries), ...Object.keys(notNeededPackages.packages)]);

let bytesRead = 0;
const seenResults = new Map<string, { coreVersion: string; containsTypes: boolean }>();
for (const date of dates) {
  const fh = await open(fullJsonFileName, "r");
  const start = bytesRead;
  bytesRead = (await fh.stat()).size;
  for await (const line of fh.readLines({ start })) {
    const result: FullJsonLine = JSON.parse(line);
    seenResults.set(result.packageSpec, {
      coreVersion: result.coreVersion,
      containsTypes:
        result.analysis.types &&
        ((result.analysis.types as any) === "included" || result.analysis.types.kind === "included"),
    });
  }
  await fh.close();

  const work = [];
  const packages: (DatesJson["dates"][string][number] & { typesPackageUrl: string | boolean })[] = [];
  const errors: { packageName: string; message: string }[] = [];
  if (!existingDates.dates?.[date] || existingDates.npmHighImpactVersion !== npmHighImpactVersion) {
    console.log(`*** Fetching versions for ${date} ***`);
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar.start(npmHighImpact.length, 0);
    await nAtATime(10, npmHighImpact, async (packageName) => {
      try {
        const manifest = await pacote.manifest(`${packageName}@latest`, {
          before: new Date(date),
        });

        bar.increment();
        const packageVersion = manifest.version;
        const tarballUrl = manifest.dist.tarball;
        packages.push({
          packageName,
          packageVersion,
          tarballUrl,
          typesPackageUrl: typesPackages.has(ts.getTypesPackageName(packageName)),
        });
      } catch (e) {
        errors.push({ packageName, message: (e as any).message });
      }
    });
    bar.stop();

    existingDates.dates[date] = packages;
    await writeFile(datesFileName, JSON.stringify(existingDates, undefined, 2));
    datesModified = true;
  } else {
    console.log(`*** Using cached versions for ${date} ***`);
    packages.push(
      ...existingDates.dates[date].map((p) => ({
        ...p,
        typesPackageUrl: (("typesPackageUrl" in p) as any) ? p.typesPackageUrl! : typesPackages.has(p.packageName),
      }))
    );
  }

  for (const pkg of packages) {
    if (isIgnoredPackage(pkg.packageName, pkg.packageVersion)) {
      continue;
    }
    const existing = seenResults.get(`${pkg.packageName}@${pkg.packageVersion}`);
    if (
      !existing ||
      ((existing.containsTypes || pkg.typesPackageUrl) &&
        (major(existing.coreVersion) !== major(versions.core) || minor(existing.coreVersion) !== minor(versions.core)))
    ) {
      work.push({ ...pkg });
    }
  }

  console.log(
    `\nDate: ${date}\n  Packages: ${packages.length}\n  To check: ${work.length}\n  Errors: ${errors.length}\n${errors
      .map(({ packageName, message }) => `  - ${packageName}: ${message}`)
      .join(`\n`)}`
  );

  const workerCount = Math.min(os.cpus().length - 1 || 1, 6);
  fullModified = await checkPackages(work, outJsonFileName, workerCount, date, (packageName, typesPackageUrl) => {
    Object.keys(existingDates.dates).forEach((date) => {
      const version = existingDates.dates[date].find((v) => v.packageName === packageName);
      if (version) {
        version.typesPackageUrl = typesPackageUrl;
      }
    });
  });

  await writeFile(datesFileName, JSON.stringify(existingDates, undefined, 2));
}

console.log("Cleaning full.json");
const cleanedFileName = new URL("../data/cleaned.json", import.meta.url);
const allSpecs = new Set<string>();
for (const date of Object.keys(existingDates.dates)) {
  for (const { packageName, packageVersion } of existingDates.dates[date]) {
    if (!isIgnoredPackage(packageName, packageVersion)) {
      allSpecs.add(`${packageName}@${packageVersion}`);
    }
  }
}

if (
  await stat(outJsonFileName).then(
    () => true,
    () => false
  )
) {
  const outFh = await open(outJsonFileName, "r");
  const newSpecs = new Set<string>();
  for await (const line of outFh.readLines()) {
    const result: FullJsonLine = JSON.parse(line);
    if (allSpecs.has(result.packageSpec)) {
      newSpecs.add(result.packageSpec);
      appendFileSync(cleanedFileName, `${JSON.stringify(result, (key, value) => (key === "trace" ? [] : value))}\n`);
      fullModified = true;
    }
  }
  await outFh.close();

  const fullFh = await open(fullJsonFileName, "r");
  for await (const line of fullFh.readLines()) {
    const result: FullJsonLine = JSON.parse(line);
    if (!newSpecs.has(result.packageSpec)) {
      appendFileSync(cleanedFileName, `${JSON.stringify(result, (key, value) => (key === "trace" ? [] : value))}\n`);
      fullModified = true;
    }
  }

  await fullFh.close();
  await unlink(fullJsonFileName);
  await rename(cleanedFileName, fullJsonFileName);
  await new Promise((resolve, reject) => {
    createReadStream(fullJsonFileName)
      .pipe(createGzip({ level: 9 }))
      .pipe(createWriteStream(`${fullJsonFileName.pathname}.gz`))
      .on("error", reject)
      .on("close", resolve);
  });

  if (datesModified || fullModified) {
    await uploadData();
  }
}

function nAtATime<T>(n: number, items: T[], fn: (item: T) => Promise<void>) {
  return new Promise<void>((resolve, reject) => {
    const queue = [...items];
    let running = 0;
    let done = 0;
    next();
    function next() {
      if (done === items.length) {
        return resolve();
      }
      while (running < n && queue.length) {
        running++;
        fn(queue.shift()!).then(
          () => {
            running--;
            done++;
            next();
          },
          (e) => {
            reject(e);
          }
        );
      }
    }
  });
}

function isIgnoredPackage(packageName: string, packageVersion: string) {
  return (
    excludePackages.includes(packageName) ||
    packageName.startsWith("@types/") ||
    excludedSpecs.includes(`${packageName}@${packageVersion}`)
  );
}
