import { untar } from "@andrewbranch/untar.js";
import { gunzipSync } from "fflate";
import ts from "typescript";
import { parsePackageSpec } from "./utils.js";
import { maxSatisfying } from "semver";

export interface Package {
  packageName: string;
  packageVersion: string;
  readFile: (path: string) => string;
  fileExists: (path: string) => boolean;
  directoryExists: (path: string) => boolean;
  listFiles: () => string[];
}

export async function createPackageFromNpm(packageSpec: string): Promise<Package> {
  const parsed = parsePackageSpec(packageSpec);
  if (parsed.status === "error") {
    throw new Error(parsed.error);
  }
  const packageName = parsed.data.name;
  const packageVersion = parsed.data.version || "latest";
  const registryUrl =
    parsed.data.versionKind === "range"
      ? `https://registry.npmjs.org/${packageName}`
      : `https://registry.npmjs.org/${packageName}/${packageVersion}`;
  const Accept = parsed.data.versionKind === "range" ? "application/vnd.npm.install-v1+json" : "application/json";
  const doc = await fetch(registryUrl, { headers: { Accept } }).then((r) => r.json());
  let tarballUrl;
  if (parsed.data.versionKind === "range") {
    const version = maxSatisfying(Object.keys(doc.versions), parsed.data.version);
    if (!version) {
      throw new Error(`No version found matching '${packageVersion}'`);
    }
    tarballUrl = doc.versions[version].dist.tarball;
  } else {
    tarballUrl = doc.dist.tarball;
  }
  return createPackageFromTarballUrl(tarballUrl);
}

export async function createPackageFromTarballUrl(tarballUrl: string): Promise<Package> {
  const tarball = new Uint8Array((await fetch(tarballUrl).then((r) => r.arrayBuffer())) satisfies ArrayBuffer);
  return createPackageFromTarballData(tarball);
}

export async function createPackageFromTarballData(tarball: Uint8Array): Promise<Package> {
  const data = untar(gunzipSync(tarball));
  const prefix = data[0].filename.substring(0, data[0].filename.indexOf("/") + 1);
  const packageJsonText = data.find((f) => f.filename === `${prefix}package.json`)?.fileData;
  const packageJson = JSON.parse(new TextDecoder().decode(packageJsonText));
  const packageName = packageJson.name;
  const packageVersion = packageJson.version;
  const files = data.reduce((acc: Record<string, Uint8Array>, file) => {
    acc[ts.combinePaths("/node_modules/" + packageName, file.filename.substring(prefix.length))] = file.fileData;
    return acc;
  }, {});

  return {
    packageName,
    packageVersion,
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
