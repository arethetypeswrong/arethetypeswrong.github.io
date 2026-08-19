import type { Writable } from "node:stream";

// JSON output is often longer than 64 kb. Wait for the write to actually flush
// (the callback fires once the chunk has been handled, not merely buffered) so
// the output isn't truncated when stdout is a pipe.
export async function write(data: string, out: Writable): Promise<void> {
  return new Promise((resolve, reject) => {
    out.write(data + "\n", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
