import fs from "fs";
import { access, readFile, writeFile } from "fs/promises";
import assert from "node:assert";
import { after, describe, test } from "node:test";
import { checkPackage, createPackageFromTarballData } from "@arethetypeswrong/core";

const updateSnapshots = process.env.UPDATE_SNAPSHOTS;

describe("snapshots", async () => {
  const snapshotsWritten: URL[] = [];

  after(() => {
    if (updateSnapshots && snapshotsWritten.length > 0) {
      console.log(`Updated ${snapshotsWritten.length} snapshots:`);
    } else if (snapshotsWritten.length > 0) {
      console.log(`Wrote ${snapshotsWritten.length} snapshots:`);
    }

    if (snapshotsWritten.length > 0) {
      console.log(snapshotsWritten.map((url) => `  ${url.pathname}`).join("\n"));
    }
  });

  const typesPackages: Record<string, string> = {
    "big.js@6.2.1.tgz": "@types__big.js@6.2.0.tgz",
    "react@18.2.0.tgz": "@types__react@18.2.21.tgz",
  };

  for (const fixture of fs.readdirSync(new URL("../fixtures", import.meta.url))) {
    if (fixture === ".DS_Store" || fixture.startsWith("@types__")) {
      continue;
    }
    test(fixture, async () => {
      const tarball = await readFile(new URL(`../fixtures/${fixture}`, import.meta.url));
      const typesTarball = typesPackages[fixture]
        ? await readFile(new URL(`../fixtures/${typesPackages[fixture]}`, import.meta.url))
        : undefined;
      const pkg = createPackageFromTarballData(tarball);
      const analysis = await checkPackage(
        typesTarball ? pkg.mergedWithTypes(createPackageFromTarballData(typesTarball)) : pkg
      );
      const snapshotURL = new URL(`../snapshots/${fixture}.json`, import.meta.url);
      const expectedSnapshot = JSON.stringify(analysis, null, 2) + "\n";

      if (
        await access(snapshotURL)
          .then(() => true)
          .catch(() => false)
      ) {
        const snapshot = await readFile(snapshotURL, "utf8");
        if (updateSnapshots) {
          await writeFile(snapshotURL, expectedSnapshot);
          snapshotsWritten.push(snapshotURL);
        } else {
          assert.strictEqual(snapshot, expectedSnapshot);
        }
      } else {
        await writeFile(snapshotURL, expectedSnapshot);
        snapshotsWritten.push(snapshotURL);
      }
    });
  }
});
