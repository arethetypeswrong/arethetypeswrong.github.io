import fs from "fs";
import { access, readFile, writeFile } from "fs/promises";
import { execSync, type SpawnSyncReturns } from "child_process";
import assert from "node:assert";
import { after, describe, test } from "node:test";

const attw = `node ${new URL("../../dist/index.js", import.meta.url).pathname}`;
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

  for (const fixture of fs.readdirSync(new URL("../../../core/test/fixtures", import.meta.url))) {
    if (fixture === ".DS_Store") {
      continue;
    }
    test(fixture, async () => {
      const tarballPath = new URL(`../../../core/test/fixtures/${fixture}`, import.meta.url).pathname;
      let stdout;
      let exitCode = 0;
      try {
        stdout = execSync(`${attw} ${tarballPath}`, { encoding: "utf8", env: { ...process.env, FORCE_COLOR: "0" } });
      } catch (error) {
        stdout = (error as SpawnSyncReturns<string>).stdout;
        exitCode = (error as SpawnSyncReturns<string>).status ?? 1;
      }
      const snapshotURL = new URL(`../snapshots/${fixture}.md`, import.meta.url);
      // prettier-ignore
      const expectedSnapshot = [
        `# ${fixture}`,
        "",
        "```",
        `$ attw ${tarballPath}`,
        "",
        stdout,
        "",
        "```",
        "",
        `Exit code: ${exitCode}`,
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
