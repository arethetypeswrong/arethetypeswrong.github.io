import assert from "node:assert";
import path from "node:path";
import { Writable } from "node:stream";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const directoryPath = path.dirname(fileURLToPath(import.meta.url));

// Regression test for #279: `write` must resolve only once the writable has
// actually handled the data, not merely when the source string is exhausted —
// otherwise a buffered stdout pipe can be truncated on exit.
test("write resolves only after the writable has flushed the data", async () => {
  const { write } = await import(path.resolve(directoryPath, "../../dist/write.js"));

  const chunks: string[] = [];
  let release: (() => void) | undefined;
  const out = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      // Defer completion to simulate a pipe that hasn't drained yet.
      release = () => callback();
    },
  });

  let resolved = false;
  const promise = write("hello", out).then(() => {
    resolved = true;
  });

  await new Promise((r) => setImmediate(r));
  assert.equal(resolved, false, "write() resolved before the writable flushed");

  release!();
  await promise;
  assert.equal(resolved, true);
  assert.equal(chunks.join(""), "hello\n");
});
