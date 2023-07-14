import { createReadStream, createWriteStream } from "node:fs";
import { open, readFile, stat } from "node:fs/promises";
import { createGunzip } from "node:zlib";

/**
 * @type {boolean | undefined}
 */
let decompressed;
const compressedFullJsonFileName = new URL("../data/full.json.gz", import.meta.url);
const fullJsonFileName = new URL("../data/full.json", import.meta.url);
const datesJsonFileName = new URL("../data/dates.json", import.meta.url);

async function unzip() {
  if (decompressed === undefined) {
    decompressed = await stat(fullJsonFileName)
      .then(() => true)
      .catch(() => false);
  }
  if (!decompressed) {
    return /** @type {Promise<void>} */ (
      new Promise((resolve, reject) => {
        createReadStream(compressedFullJsonFileName)
          .pipe(createGunzip())
          .pipe(createWriteStream(fullJsonFileName))
          .on("finish", () => {
            decompressed = true;
            resolve();
          })
          .on("error", reject);
      })
    );
  }
}

/** @typedef {Record<string, import("@arethetypeswrong/core").Analysis>} AllDataAsObject */

/**
 * Gets a single object containing all Analysis results for sampled packages.
 * Keys are package specs in the format `package@version`.
 * @returns {Promise<AllDataAsObject>}
 */
export async function getAllDataAsObject() {
  await unzip();
  const fh = await open(fullJsonFileName, "r");
  /** @type {Record<string, import("@arethetypeswrong/core").Analysis>} */
  const result = {};
  for await (const line of fh.readLines()) {
    /** @type {import("../scripts/types.js").FullJsonLine} */
    const { packageSpec, analysis } = JSON.parse(line);
    if (analysis.types) {
      result[packageSpec] = analysis;
    }
  }
  return result;
}

/** @typedef {Record<string, { packageName: string, packageVersion: string, tarballUrl: string }[]>} VersionsByDate */

/**
 * Gets the list of top packages processed for each sampled date.
 * Keys are dates in the format YYYY-MM-DD.
 * @returns {Promise<VersionsByDate>}
 */
export async function getVersionsByDate() {
  /** @type {import("../scripts/types.js").DatesJson} */
  const dates = JSON.parse(await readFile(datesJsonFileName, "utf8"));
  return dates.dates;
}
