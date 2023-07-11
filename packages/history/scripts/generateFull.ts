import { versions } from "@arethetypeswrong/core/versions";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import cliProgress from "cli-progress";
import "dotenv/config";
import { open, readFile, stat, writeFile } from "fs/promises";
import { createRequire } from "module";
import { npmHighImpact } from "npm-high-impact";
import os from "os";
import pacote from "pacote";
import { major, minor } from "semver";
import checkPackages from "./checkPackages.ts";
import type { DatesJson, FullJsonLine } from "./types.ts";

process.on("SIGINT", () => {
  process.exit(1);
});

const excludePackages = [
  "grunt-ts", // File not found: /node_modules/grunt-ts/defs/tsd.d.ts
  "Babel", // Expected double-quoted property name in JSON at position 450
  "aws-cdk-lib", // Takes forever
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

const blobServiceClient = new BlobServiceClient(
  "https://arethetypeswrong.blob.core.windows.net",
  new StorageSharedKeyCredential("arethetypeswrong", process.env.AZURE_STORAGE_KEY!)
);
const dataContainerClient = blobServiceClient.getContainerClient("data");
const datesBlobClient = dataContainerClient.getBlockBlobClient("dates.json");
const fullBlobClient = dataContainerClient.getBlockBlobClient("full.json");

const npmHighImpactVersion = createRequire(import.meta.url)("npm-high-impact/package.json").version;
const fullJsonFileName = new URL("../data/full.json", import.meta.url);
const datesFileName = new URL("../data/dates.json", import.meta.url);
if (
  (await datesBlobClient.getProperties()).lastModified! > (await stat(datesFileName).catch(() => ({ mtime: 0 }))).mtime
) {
  console.log("Downloading dates.json");
  await datesBlobClient.downloadToFile(datesFileName.pathname);
}
const existingDates: DatesJson = JSON.parse(await readFile(datesFileName, "utf8"));
if (
  (await fullBlobClient.getProperties()).lastModified! >
  (await stat(fullJsonFileName).catch(() => ({ mtime: 0 }))).mtime
) {
  console.log("Downloading full.json");
  await fullBlobClient.downloadToFile(fullJsonFileName.pathname);
}

let bytesRead = 0;
const seenResults = new Map<string, string>();
for (const date of dates) {
  const fh = await open(fullJsonFileName, "r");
  const start = bytesRead;
  bytesRead = (await fh.stat()).size;
  for await (const line of fh.readLines({ start })) {
    const result: FullJsonLine = JSON.parse(line);
    seenResults.set(result.packageSpec, result.coreVersion);
  }
  await fh.close();

  const work = [];
  const packages: DatesJson["dates"][string] = [];
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
        packages.push({ packageName, packageVersion, tarballUrl });
      } catch (e) {
        errors.push({ packageName, message: (e as any).message });
      }
    });
    bar.stop();

    existingDates.dates[date] = packages;
    await writeFile(datesFileName, JSON.stringify(existingDates));
  } else {
    console.log(`*** Using cached versions for ${date} ***`);
    packages.push(...existingDates.dates[date]);
  }

  for (const pkg of packages) {
    if (excludePackages.includes(pkg.packageName)) {
      continue;
    }
    const existing = seenResults.get(`${pkg.packageName}@${pkg.packageVersion}`);
    if (!existing || major(existing) !== major(versions.core) || minor(existing) !== minor(versions.core)) {
      work.push(pkg);
    }
  }

  console.log(
    `\nDate: ${date}\n  Packages: ${packages.length}\n  To check: ${work.length}\n  Errors: ${errors.length}\n${errors
      .map(({ packageName, message }) => `  - ${packageName}: ${message}`)
      .join(`\n`)}`
  );

  const workerCount = Math.min(os.cpus().length - 1 || 1, 6);
  await checkPackages(work, fullJsonFileName, workerCount);
}

console.log("Uploading dates.json");
await datesBlobClient.uploadFile(datesFileName.pathname);

console.log("Uploading full.json");
await fullBlobClient.uploadFile(fullJsonFileName.pathname);

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
