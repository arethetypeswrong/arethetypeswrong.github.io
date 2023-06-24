import { versions } from "@arethetypeswrong/core/versions";
import { open, readFile, writeFile } from "fs/promises";
import type { Blob, FullJson } from "./types.ts";
import { npmHighImpact } from "npm-high-impact";

export default async function reduceBlobs(inFile: URL) {
  const outFileName = new URL("../data/full.json", import.meta.url);
  let data: FullJson = JSON.parse(await readFile(outFileName, "utf8"));
  const fh = await open(inFile, "r");
  for await (const line of fh.readLines()) {
    if (!line) continue;
    try {
      const blob: Blob = JSON.parse(line);
      if (blob.kind === "analysis") {
        data[`${blob.data.packageName}@${blob.data.packageVersion}`] = {
          coreVersion: versions.core,
          rank: npmHighImpact.indexOf(blob.data.packageName),
          analysis: blob.data,
        };
      }
    } catch (e) {
      console.error(e);
    }
  }
  await fh.close();
  await writeFile(
    outFileName,
    JSON.stringify(data, (key, value) => {
      if (key === "trace") {
        return [];
      }
      return value;
    })
  );
}
