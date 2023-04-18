import createFetch from "fetch-ponyfill";
import { gunzipSync } from "fflate";
import ts from "typescript";
import { untar, type TarLocalFile } from "@andrewbranch/untar.js";
import type { FS, Host } from "./types.js";
const { fetch } = createFetch();

export const fetchTarballHost: Host = {
  createPackageFS,
  createPackageFSFromTarball,
};

async function createPackageFSFromTarball(tarball: Uint8Array): Promise<FS> {
  const data = gunzipSync(tarball);
  const files = untar(data);
  const prefix = files[0].filename.substring(0, files[0].filename.indexOf("/") + 1);
  const packageJson = files.find((f) => f.filename === `${prefix}package.json`)?.fileData;
  const packageName = JSON.parse(new TextDecoder().decode(packageJson)).name;
  return createFS(files, "/node_modules/" + packageName);
}

async function createPackageFS(packageName: string, packageVersion = "latest"): Promise<FS> {
  const manifestUrl = `https://registry.npmjs.org/${packageName}/${packageVersion}`;
  const manifest = await fetch(manifestUrl).then((r) => r.json());
  const tarballUrl = manifest.dist.tarball;
  const tarball = new Uint8Array((await fetch(tarballUrl).then((r) => r.arrayBuffer())) satisfies ArrayBuffer);
  const data = gunzipSync(tarball);
  return createFS(untar(data), "/node_modules/" + packageName);
}

function createFS(data: TarLocalFile[], basePath = ""): FS {
  const prefix = data[0].filename.substring(0, data[0].filename.indexOf("/") + 1);
  const files = data.reduce((acc: Record<string, Uint8Array>, file) => {
    acc[ts.combinePaths(basePath, file.filename.substring(prefix.length))] = file.fileData;
    return acc;
  }, {});

  return {
    readFile: (path: string) => {
      const file = files[path];
      if (!file) {
        throw new Error(`File not found: ${path}`);
      }
      return new TextDecoder().decode(file);
    },
    fileExists: (path: string) => path in files,
    directoryExists: (path: string) => {
      path = ts.ensureTrailingDirectorySeparator(path);
      for (const file in files) {
        if (file.startsWith(path)) {
          return true;
        }
      }
      return false;
    },
    listFiles: () => Object.keys(files),
  };
}
