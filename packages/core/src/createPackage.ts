import { untar } from "@andrewbranch/untar.js";
import { gunzipSync } from "fflate";
import ts from "typescript";
import { parsePackageSpec, type ParsedPackageSpec } from "./utils.js";
import { maxSatisfying, major, minor, valid, validRange } from "semver";

export class Package {
  #files: Record<string, string | Uint8Array> = {};
  readonly packageName: string;
  readonly packageVersion: string;
  readonly typesPackage?: {
    packageName: string;
    packageVersion: string;
  };

  constructor(
    files: Record<string, string | Uint8Array>,
    packageName: string,
    packageVersion: string,
    typesPackage?: {
      packageName: string;
      packageVersion: string;
    }
  ) {
    this.#files = files;
    this.packageName = packageName;
    this.packageVersion = packageVersion;
    this.typesPackage = typesPackage;
  }

  readFile(path: string): string {
    const file = this.#files[path];
    if (!file) {
      throw new Error(`File not found: ${path}`);
    }
    if (typeof file === "string") {
      return file;
    }
    const content = new TextDecoder().decode(file);
    this.#files[path] = content;
    return content;
  }

  fileExists(path: string): boolean {
    return path in this.#files;
  }

  directoryExists(path: string): boolean {
    path = ts.ensureTrailingDirectorySeparator(path);
    for (const file in this.#files) {
      if (file.startsWith(path)) {
        return true;
      }
    }
    return false;
  }

  containsTypes(directory = "/"): boolean {
    return this.listFiles(directory).some(ts.hasTSFileExtension);
  }

  listFiles(directory = "/"): string[] {
    directory = ts.ensureTrailingDirectorySeparator(directory);
    return directory === "/"
      ? Object.keys(this.#files)
      : Object.keys(this.#files).filter((f) => f.startsWith(directory));
  }

  mergedWithTypes(typesPackage: Package): Package {
    const files = { ...this.#files, ...typesPackage.#files };
    return new Package(files, this.packageName, this.packageVersion, {
      packageName: typesPackage.packageName,
      packageVersion: typesPackage.packageVersion,
    });
  }
}

export interface CreatePackageFromNpmOptions {
  /**
   * Controls inclusion of a corresponding `@types` package. Ignored if the implementation
   * package contains TypeScript files. The value is the version or SemVer range of the
   * `@types` package to include, `true` to infer the version from the implementation
   * package version, or `false` to prevent inclusion of a `@types` package.
   * @default true
   */
  definitelyTyped?: string | boolean;
}

export async function createPackageFromNpm(
  packageSpec: string,
  { definitelyTyped = true }: CreatePackageFromNpmOptions = {}
): Promise<Package> {
  const parsed = parsePackageSpec(packageSpec);
  if (parsed.status === "error") {
    throw new Error(parsed.error);
  }
  const packageName = parsed.data.name;
  const spec =
    parsed.data.versionKind === "none" && typeof definitelyTyped === "string"
      ? parsePackageSpec(`${packageName}@${definitelyTyped}`)
      : parsed;
  const { tarballUrl, version } = await getNpmTarballUrl(spec.data || parsed.data);
  const pkg = await createPackageFromTarballUrl(tarballUrl);
  if (!definitelyTyped || pkg.containsTypes()) {
    return pkg;
  }

  const typesPackageName = ts.getTypesPackageName(packageName);
  let typesPackageData;
  if (definitelyTyped === true) {
    try {
      typesPackageData = await getNpmTarballUrl({
        name: typesPackageName,
        versionKind: "range",
        version: `${major(version)}.${minor(version)}`,
      });
    } catch {
      try {
        typesPackageData = await getNpmTarballUrl({
          name: typesPackageName,
          versionKind: "range",
          version: `${major(version)}`,
        });
      } catch {
        try {
          typesPackageData = await getNpmTarballUrl({
            name: typesPackageName,
            versionKind: "tag",
            version: "latest",
          });
        } catch {
          typesPackageData = undefined;
        }
      }
    }
  } else {
    typesPackageData = await getNpmTarballUrl({
      name: typesPackageName,
      versionKind: valid(definitelyTyped) ? "exact" : validRange(definitelyTyped) ? "range" : "tag",
      version: definitelyTyped,
    });
  }

  if (typesPackageData) {
    return pkg.mergedWithTypes(await createPackageFromTarballUrl(typesPackageData.tarballUrl));
  }
  return pkg;
}

async function getNpmTarballUrl(packageSpec: ParsedPackageSpec): Promise<{ tarballUrl: string; version: string }> {
  const registryUrl =
    packageSpec.versionKind === "range" || (packageSpec.versionKind === "tag" && packageSpec.version !== "latest")
      ? `https://registry.npmjs.org/${packageSpec.name}`
      : `https://registry.npmjs.org/${packageSpec.name}/${packageSpec.version || "latest"}`;
  const Accept =
    packageSpec.versionKind === "range" || (packageSpec.versionKind === "tag" && packageSpec.version !== "latest")
      ? "application/vnd.npm.install-v1+json"
      : "application/json";
  const doc = await fetch(registryUrl, { headers: { Accept } }).then((r) => r.json());
  let tarballUrl, version;
  if (packageSpec.versionKind === "range") {
    version = maxSatisfying(Object.keys(doc.versions), packageSpec.version);
    if (!version) {
      throw new Error(`No version found matching '${packageSpec.version}'`);
    }
    tarballUrl = doc.versions[version].dist.tarball;
  } else if (packageSpec.versionKind === "tag" && packageSpec.version !== "latest") {
    version = doc["dist-tags"][packageSpec.version];
    if (!version) {
      throw new Error(`No version found matching '${packageSpec.version}'`);
    }
    tarballUrl = doc.versions[version].dist.tarball;
  } else {
    version = doc.version;
    tarballUrl = doc.dist.tarball;
  }
  return { version, tarballUrl };
}

export async function createPackageFromTarballUrl(tarballUrl: string): Promise<Package> {
  const tarball = await fetchTarball(tarballUrl);
  return createPackageFromTarballData(tarball);
}

async function fetchTarball(tarballUrl: string) {
  return new Uint8Array((await fetch(tarballUrl).then((r) => r.arrayBuffer())) satisfies ArrayBuffer);
}

export function createPackageFromTarballData(tarball: Uint8Array): Package {
  const { files, packageName, packageVersion } = extractTarball(tarball);
  return new Package(files, packageName, packageVersion);
}

function extractTarball(tarball: Uint8Array) {
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
  return { files, packageName, packageVersion };
}
