import fs from "fs";
import { access, readFile, writeFile } from "fs/promises";
import assert from "node:assert";
import { after, describe, test } from "node:test";
import { checkTgz } from "@arethetypeswrong/core";

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

  for (const fixture of fs.readdirSync(new URL("../fixtures", import.meta.url))) {
    if (fixture === ".DS_Store") {
      continue;
    }
    test(fixture, async () => {
      const tarball = await readFile(new URL(`../fixtures/${fixture}`, import.meta.url));
      const analysis = await checkTgz(tarball);
      const snapshotURL = new URL(`../snapshots/${fixture}.md`, import.meta.url);
      const expectedSnapshot = [
        `# ${fixture}`,
        "",
        "## Problems",
        "",
        "```json",
        JSON.stringify(analysis.types ? analysis.problems : [], null, 2),
        "```",
      ].join("\n");

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
