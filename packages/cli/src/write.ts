import { Readable, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";

// JSON output is often longer than 64 kb, so we need to use streams to write it to stdout
// in order to avoid truncation when piping to other commands.
export function write(data: string, out: Writable = process.stdout): Promise<void> {
  const stream = new Readable();
  stream.push(data);
  stream.push(null);
  return pipeline(stream, out);
}
