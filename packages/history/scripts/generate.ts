import { versions } from "@arethetypeswrong/core/versions";
import { mkdir, readFile, writeFile } from "fs/promises";
import { npmHighImpact } from "npm-high-impact";
import os from "os";
import cliProgress from "cli-progress";
import pacote from "pacote";
import { major, minor } from "semver";
import checkPackages from "./checkPackages.ts";
import reduceBlobs from "./reduceBlobs.ts";
import type { DatesJson, FullJson } from "./types.ts";
import { createRequire } from "module";

const existingData: FullJson = JSON.parse(await readFile(new URL("../data/full.json", import.meta.url), "utf8"));
// Array of dates from 2023-01-01 until the first of this month
const startYear = 2023;
const dates = Array.from({ length: new Date().getMonth() * (new Date().getFullYear() - startYear + 1) }, (_, i) => {
  const month = String((i % 12) + 1).padStart(2, "0");
  const year = String(Math.floor(i / 12) + startYear);
  return `${year}-${month}-01`;
});

const npmHighImpactVersion = createRequire(import.meta.url)("npm-high-impact/package.json").version;

for (const date of dates) {
  const work = [];
  const packages = [];
  const errors = [];
  const datesFileName = new URL("../data/dates.json", import.meta.url);
  const existingDates: DatesJson = JSON.parse(await readFile(datesFileName, "utf8"));
  if (!existingDates.dates?.[date] || existingDates.npmHighImpactVersion !== npmHighImpactVersion) {
    console.log(`*** Fetching versions for ${date} ***`);
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar.start(npmHighImpact.length, 0);
    for (const packageName of npmHighImpact) {
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
    }
    bar.stop();

    await writeFile(
      datesFileName,
      JSON.stringify({
        npmHighImpactVersion,
        dates: {
          ...existingDates.dates,
          [date]: packages,
        },
      } satisfies DatesJson)
    );
  } else {
    console.log(`*** Using cached versions for ${date} ***`);
    packages.push(...existingDates.dates[date]);
  }

  for (const pkg of packages) {
    const existing = existingData[`${pkg.packageName}@${pkg.packageVersion}`];
    if (
      !existing ||
      major(existing.coreVersion) !== major(versions.core) ||
      minor(existing.coreVersion) !== minor(versions.core)
    ) {
      work.push(pkg);
    }
  }

  console.log(
    `\nDate: ${date}\n  Packages: ${packages.length}\n  To check: ${work.length}\n  Errors: ${errors.length}\n${errors
      .map(({ packageName, message }) => `  - ${packageName}: ${message}`)
      .join(`\n`)}`
  );
  if (errors.length / packages.length > 0.01) {
    throw new Error(`Too many errors for ${date}. Abandon ship.`);
  }

  const tmpFileName = new URL(`../tmp/${date.replace(/-/g, "")}.json`, import.meta.url);
  const workerCount = Math.min(os.cpus().length - 1 || 1, 6);
  await mkdir(new URL("../tmp", import.meta.url), { recursive: true });
  await writeFile(tmpFileName, "");
  await checkPackages(work, tmpFileName, workerCount);

  console.log(`Reducing ${tmpFileName} to full.json\n\n`);
  await reduceBlobs(tmpFileName);
}
