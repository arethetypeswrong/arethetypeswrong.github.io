import os from "os";
import { mkdir } from "fs/promises";
import { valid } from "semver";
import { checkPackages } from "./worker.ts";
import { npmHighImpact } from "npm-high-impact";

let [date] = process.argv.slice(2);
if (date && !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
  throw new Error(`Invalid date argument. Must be in the format YYYY-MM-DD.`);
}
if (date && new Date(date).toString() === "Invalid Date") {
  throw new Error(`Invalid date argument. Must be in the format YYYY-MM-DD.`);
}
if (date && new Date(date) > new Date()) {
  throw new Error(`Invalid date argument. Must be in the past.`);
}

const packages = [];
for (const packageName of npmHighImpact) {
  if (date) {
    const manifest = await fetch(`https://registry.npmjs.org/${packageName}`).then((r) => r.json());
    const versions = Object.keys(manifest.time);
    for (let i = versions.length; i--; i > 0) {
      const version = versions[i];
      if (valid(version) && new Date(manifest.time[version]) < new Date(date)) {
        packages.push({ packageName, packageVersion: version });
        break;
      }
    }
  } else {
    packages.push({ packageName, packageVersion: "latest" });
  }
}

date ??= new Date().toISOString().substring(0, 10);
const fileName = new URL(`../tmp/${date.replace(/-/g, "")}.json`, import.meta.url);
const workerCount = Math.min(os.cpus().length - 1 || 1, 8);
await mkdir(new URL("../tmp", import.meta.url), { recursive: true });
await checkPackages(packages, fileName, workerCount);
