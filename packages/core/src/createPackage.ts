import { untar } from "@andrewbranch/untar.js";
import { gunzipSync } from "fflate";
import ts from "typescript";
import { parsePackageSpec, type ParsedPackageSpec } from "./utils.js";
import { maxSatisfying, major, minor, valid, validRange } from "semver";

export class Package {
  #files: Record<string, string | Uint8Array> = {};
  readonly packageName: string;
  readonly packageVersion: string;
  readonly resolvedUrl?: string;
  readonly typesPackage?: {
    packageName: string;
    packageVersion: string;
    resolvedUrl?: string;
  };

  constructor(
    files: Record<string, string | Uint8Array>,
    packageName: string,
    packageVersion: string,
    resolvedUrl?: string,
    typesPackage?: Package["typesPackage"],
  ) {
    this.#files = files;
    this.packageName = packageName;
    this.packageVersion = packageVersion;
    this.resolvedUrl = resolvedUrl;
    this.typesPackage = typesPackage;
  }

  tryReadFile(path: string): string | undefined {
    const file = this.#files[path];
    if (file === undefined) {
      return undefined;
    }
    if (typeof file === "string") {
      return file;
    }
    const content = new TextDecoder().decode(file);
    this.#files[path] = content;
    return content;
  }

  readFile(path: string): string {
    const content = this.tryReadFile(path);
    if (content === undefined) {
      throw new Error(`File not found: ${path}`);
    }
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
    return new Package(files, this.packageName, this.packageVersion, this.resolvedUrl, {
      packageName: typesPackage.packageName,
      packageVersion: typesPackage.packageVersion,
      resolvedUrl: typesPackage.resolvedUrl,
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
  before?: Date;
}

export async function createPackageFromNpm(
  packageSpec: string,
  { definitelyTyped = true, before }: CreatePackageFromNpmOptions = {},
): Promise<Package> {
  const parsed = parsePackageSpec(packageSpec);
  if (parsed.status === "error") {
    throw new Error(parsed.error);
  }
  const packageName = parsed.data.name;
  const { tarballUrl, packageVersion } =
    parsed.data.versionKind === "none" && typeof definitelyTyped === "string"
      ? await resolveImplementationPackageForTypesPackage(packageName, definitelyTyped, { before })
      : await getNpmTarballUrl([parsed.data], before);
  const pkg = await createPackageFromTarballUrl(tarballUrl);
  if (!definitelyTyped || pkg.containsTypes()) {
    return pkg;
  }

  const typesPackageName = ts.getTypesPackageName(packageName);
  let typesPackageData;
  if (definitelyTyped === true) {
    typesPackageData = await resolveTypesPackageForPackage(packageName, packageVersion, before);
  } else {
    typesPackageData = await getNpmTarballUrl(
      [
        {
          name: typesPackageName,
          versionKind: valid(definitelyTyped) ? "exact" : validRange(definitelyTyped) ? "range" : "tag",
          version: definitelyTyped,
        },
      ],
      before,
    );
  }

  if (typesPackageData) {
    return pkg.mergedWithTypes(await createPackageFromTarballUrl(typesPackageData.tarballUrl));
  }
  return pkg;
}

export async function resolveImplementationPackageForTypesPackage(
  typesPackageName: string,
  typesPackageVersion: string,
  options?: Pick<CreatePackageFromNpmOptions, "before">,
): Promise<ResolvedPackageId> {
  if (!typesPackageName.startsWith("@types/")) {
    throw new Error(`'resolveImplementationPackageForTypesPackage' expects an @types package name and version`);
  }
  const packageName = ts.unmangleScopedPackageName(typesPackageName.slice("@types/".length));
  return getNpmTarballUrl(
    [
      parsePackageSpec(`${packageName}@${major(typesPackageVersion)}.${minor(typesPackageVersion)}`).data!,
      parsePackageSpec(`${packageName}@${major(typesPackageVersion)}`).data!,
      parsePackageSpec(`${packageName}@latest`).data!,
    ],
    options?.before,
  );
}

export async function resolveTypesPackageForPackage(
  packageName: string,
  packageVersion: string,
  before?: Date,
): Promise<ResolvedPackageId | undefined> {
  const typesPackageName = ts.getTypesPackageName(packageName);
  try {
    return await getNpmTarballUrl(
      [
        {
          name: typesPackageName,
          versionKind: "range",
          version: `${major(packageVersion)}.${minor(packageVersion)}`,
        },
        {
          name: typesPackageName,
          versionKind: "range",
          version: `${major(packageVersion)}`,
        },
        {
          name: typesPackageName,
          versionKind: "tag",
          version: "latest",
        },
      ],
      before,
    );
  } catch {}
}

export interface ResolvedPackageId {
  packageName: string;
  packageVersion: string;
  tarballUrl: string;
}

async function getNpmTarballUrl(packageSpecs: readonly ParsedPackageSpec[], before?: Date): Promise<ResolvedPackageId> {
  const fetchPackument = packageSpecs.some(
    (spec) => spec.versionKind === "range" || (spec.versionKind === "tag" && spec.version !== "latest"),
  );
  const packumentUrl = `https://registry.npmjs.org/${packageSpecs[0].name}`;
  const includeTimes = before !== undefined && packageSpecs.some((spec) => spec.versionKind !== "exact");
  const Accept = includeTimes ? "application/json" : "application/vnd.npm.install-v1+json";
  const packument = fetchPackument
    ? await fetch(packumentUrl, { headers: { Accept } }).then((r) => r.json())
    : undefined;

  for (const packageSpec of packageSpecs) {
    const manifestUrl = `https://registry.npmjs.org/${packageSpec.name}/${packageSpec.version || "latest"}`;
    const doc = packument || (await fetch(manifestUrl).then((r) => r.json()));
    if (typeof doc !== "object") {
      continue;
    }
    const isManifest = !!doc.version;
    let tarballUrl, packageVersion;
    if (packageSpec.versionKind === "range") {
      packageVersion = maxSatisfying(
        Object.keys(doc.versions).filter(
          (v) => !doc.versions[v].deprecated && (!before || !doc.time || new Date(doc.time[v]) <= before),
        ),
        packageSpec.version,
      );
      if (!packageVersion) {
        continue;
      }
      tarballUrl = doc.versions[packageVersion].dist.tarball;
    } else if (packageSpec.versionKind === "tag" && packageSpec.version !== "latest") {
      packageVersion = doc["dist-tags"][packageSpec.version];
      if (!packageVersion) {
        continue;
      }
      if (before && doc.time && new Date(doc.time[packageVersion]) > before) {
        continue;
      }
      tarballUrl = doc.versions[packageVersion].dist.tarball;
    } else if (isManifest) {
      packageVersion = doc.version;
      tarballUrl = doc.dist.tarball;
    } else {
      packageVersion = doc["dist-tags"].latest;
      tarballUrl = doc.versions[packageVersion].dist.tarball;
    }

    if (packageVersion && tarballUrl) {
      return { packageName: packageSpec.name, packageVersion, tarballUrl };
    }
  }
  throw new Error(`Failed to find a matching version for ${packageSpecs[0].name}`);
}

export async function createPackageFromTarballUrl(tarballUrl: string): Promise<Package> {
  const tarball = await fetchTarball(tarballUrl);
  const { files, packageName, packageVersion } = extractTarball(tarball);
  return new Package(files, packageName, packageVersion, tarballUrl);
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
