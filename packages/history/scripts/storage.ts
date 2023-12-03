import "dotenv/config";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { createReadStream, createWriteStream } from "node:fs";
import { stat, mkdir } from "node:fs/promises";
import { createGunzip } from "node:zlib";
import { dirname } from "node:path";

const blobServiceClient = new BlobServiceClient(
  "https://arethetypeswrong.blob.core.windows.net",
  new StorageSharedKeyCredential("arethetypeswrong", process.env.AZURE_STORAGE_KEY!),
);
const dataContainerClient = blobServiceClient.getContainerClient("data");
const datesBlobClient = dataContainerClient.getBlockBlobClient("dates.json");
const fullBlobClient = dataContainerClient.getBlockBlobClient("full.json.gz");

const fullJsonFileName = new URL("../data/full.json", import.meta.url);
const datesFileName = new URL("../data/dates.json", import.meta.url);

export async function downloadData() {
  await mkdir(dirname(datesFileName.pathname), { recursive: true });
  if (
    (await datesBlobClient.exists()) &&
    (await datesBlobClient.getProperties()).lastModified! >
      (await stat(datesFileName).catch(() => ({ mtime: 0 }))).mtime
  ) {
    console.log("Downloading dates.json");
    await datesBlobClient.downloadToFile(datesFileName.pathname);
  }

  if (
    (await fullBlobClient.exists()) &&
    (await fullBlobClient.getProperties()).lastModified! >
      (await stat(fullJsonFileName).catch(() => ({ mtime: 0 }))).mtime
  ) {
    console.log("Downloading full.json.gz");
    await fullBlobClient.downloadToFile(`${fullJsonFileName.pathname}.gz`);
    console.log("Unzipping full.json.gz");
    await new Promise((resolve, reject) => {
      createReadStream(`${fullJsonFileName.pathname}.gz`)
        .pipe(createGunzip())
        .pipe(createWriteStream(fullJsonFileName.pathname))
        .on("error", reject)
        .on("finish", resolve);
    });
  }
}

export async function uploadData() {
  console.log("Uploading dates.json");
  await datesBlobClient.uploadFile(datesFileName.pathname);
  console.log("Uploading full.json.gz");
  await fullBlobClient.uploadFile(`${fullJsonFileName.pathname}.gz`);
}

if (process.argv[1] === new URL(import.meta.url).pathname && process.argv[2] === "download") {
  await downloadData();
}
