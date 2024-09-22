import { access, readFile, writeFile } from "fs/promises";
import { execSync, type SpawnSyncReturns } from "child_process";
import assert from "node:assert";
import { after, describe, test } from "node:test";

const attw = `node ${new URL("../../dist/index.js", import.meta.url).pathname}`;
const updateSnapshots = process.env.UPDATE_SNAPSHOTS || process.env.U;
const testFilter = (process.env.TEST_FILTER || process.env.T)?.toLowerCase();

const tests = [
  ["@apollo__client-3.7.16.tgz"],
  ["@ice__app@3.2.6.tgz"],
  ["@reduxjs__toolkit@2.0.0-beta.0.tgz"],
  ["@vitejs__plugin-react@3.1.0.tgz"],
  ["ajv@8.12.0.tgz"],
  ["astring@1.8.6.tgz"],
  ["axios@1.4.0.tgz"],
  ["commander@10.0.1.tgz", "-f table"],
  ["ejs@3.1.9.tgz"],
  ["hexoid@1.0.0.tgz"],
  ["klona@2.0.6.tgz", "-f ascii"],
  ["node-html-parser@6.1.5.tgz"],
  ["postcss@8.4.21.tgz"],
  ["react-chartjs-2@5.2.0.tgz"],
  ["rfdc@1.3.0.tgz"],
  ["vue@3.3.4.tgz"],
  ["moment@2.29.1.tgz"],
  ["Babel@0.0.1.tgz"],

  ["vue@3.3.4.tgz", "--entrypoints vue"],
  ["vue@3.3.4.tgz", "--entrypoints . jsx-runtime"],
  ["vue@3.3.4.tgz", "--exclude-entrypoints macros -f ascii"],
  ["vue@3.3.4.tgz", "--include-entrypoints ./foo -f ascii"],

  [
    "big.js@6.2.1.tgz",
    `--definitely-typed ${new URL("../../../core/test/fixtures/@types__big.js@6.2.0.tgz", import.meta.url).pathname}`,
  ],
  [
    "react@18.2.0.tgz",
    `--definitely-typed ${new URL("../../../core/test/fixtures/@types__react@18.2.21.tgz", import.meta.url).pathname}`,
  ],

  ["eslint-module-utils@2.8.1.tgz", "--entrypoints-legacy --ignore-rules=cjs-only-exports-default"],
  ["@cerbos__core@0.18.1.tgz"],

  // Profile test cases
  // Some ignored failures and some not - exit code should be 1 per non-node10 failures
  ["axios@1.4.0.tgz", "--profile node16"],
  // Explicit strict profile - exit code 1 per node10 resolution
  ["@fluid-experimental__presence@2.3.0.tgz", "--profile strict -f table"],
  // Profile ignoring node10 resolution - exit code 0
  ["@fluid-experimental__presence@2.3.0.tgz", "--profile node16 -f table-flipped"],
  // Profile ignoring node10 and CJS resolution mixed with specific entrypoint - exit code 0
  ["@fluid-experimental__presence@2.3.0.tgz", "--profile esm-only -f json --entrypoints ."],
  // Profile ignoring node10 and bundler resolution - exit code 0
  ["@fluid-experimental__presence@2.3.0.tgz", "--profile node16-only -f ascii"],
];

const defaultOpts = "-f table-flipped";

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

  for (const [tarball, options] of tests) {
    const fixture = tarball + (options ? ` ${stripPaths(options)}` : "");
    if (testFilter && !fixture.toLowerCase().includes(testFilter)) {
      continue;
    }

    test(fixture, async () => {
      const tarballPath = new URL(`../../../core/test/fixtures/${tarball}`, import.meta.url).pathname;
      let stdout;
      let stderr = "";
      let exitCode = 0;
      try {
        stdout = execSync(`${attw} ${tarballPath} ${options ?? defaultOpts}`, {
          encoding: "utf8",
          env: { ...process.env, FORCE_COLOR: "0" },
        });
      } catch (error) {
        stdout = (error as SpawnSyncReturns<string>).stdout;
        stderr = (error as SpawnSyncReturns<string>).stderr;
        exitCode = (error as SpawnSyncReturns<string>).status ?? 1;
      }
      const snapshotURL = new URL(`../snapshots/${fixture}.md`, import.meta.url);
      // prettier-ignore
      const expectedSnapshot = [
        `# ${fixture}`,
        "",
        "```",
        `$ attw ${tarball} ${stripPaths(options ?? defaultOpts)}`,
        "",
        [stdout, stderr].filter(Boolean).join("\n"),
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

function stripPaths(input: string): string {
  return input.replace(/ .*[\\\/](?=[^\\\/]*$)/g, " ");
}
