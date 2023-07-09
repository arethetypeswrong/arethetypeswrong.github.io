import ts from "typescript";
import { getEntrypointResolutionProblems } from "./checks/entrypointResolutionProblems.js";
import { getFileProblems } from "./checks/fileProblems.js";
import { getResolutionBasedFileProblems } from "./checks/resolutionBasedFileProblems.js";
import type { Package } from "./createPackage.js";
import { createCompilerHosts, type CompilerHosts, CompilerHostWrapper } from "./multiCompilerHost.js";
import type { CheckResult, EntrypointInfo, EntrypointResolutionAnalysis, Resolution, ResolutionKind } from "./types.js";

export interface CheckPackageOptions {
  /**
   * Exhaustive list of entrypoints to check. The package root is `"."`.
   * Specifying this option disables automatic entrypoint discovery,
   * and overrides the `includeEntrypoints` and `excludeEntrypoints` options.
   */
  entrypoints?: string[];
  /**
   * Entrypoints to check in addition to automatically discovered ones.
   */
  includeEntrypoints?: string[];
  /**
   * Entrypoints to exclude from checking.
   */
  excludeEntrypoints?: (string | RegExp)[];
}

export async function checkPackage(pkg: Package, options?: CheckPackageOptions): Promise<CheckResult> {
  const files = pkg.listFiles();
  const types = files.some(ts.hasTSFileExtension) ? "included" : false;
  const parts = files[0].split("/");
  let packageName = parts[2];
  if (packageName.startsWith("@")) {
    packageName = parts.slice(2, 4).join("/");
  }
  const packageJsonContent = JSON.parse(pkg.readFile(`/node_modules/${packageName}/package.json`));
  const packageVersion = packageJsonContent.version;
  if (!types) {
    return { packageName, packageVersion, types };
  }

  const hosts = createCompilerHosts(pkg);
  const entrypointResolutions = getEntrypointInfo(packageName, pkg, hosts, options);
  const entrypointResolutionProblems = getEntrypointResolutionProblems(entrypointResolutions, hosts);
  const resolutionBasedFileProblems = getResolutionBasedFileProblems(packageName, entrypointResolutions, hosts);
  const fileProblems = getFileProblems(entrypointResolutions, hosts);

  return {
    packageName,
    packageVersion,
    types,
    entrypoints: entrypointResolutions,
    problems: [...entrypointResolutionProblems, ...resolutionBasedFileProblems, ...fileProblems],
  };
}

function getEntrypoints(fs: Package, exportsObject: any, options: CheckPackageOptions | undefined): string[] {
  if (options?.entrypoints) {
    return options.entrypoints.map((e) => formatEntrypointString(e, fs.packageName));
  }
  if (exportsObject === undefined && fs) {
    const proxies = getProxyDirectories(`/node_modules/${fs.packageName}`, fs);
    if (proxies.length === 0) {
      return ["."];
    }
    return proxies;
  }
  const detectedSubpaths = getSubpaths(exportsObject);
  if (detectedSubpaths.length === 0) {
    detectedSubpaths.push(".");
  }
  const included = unique([
    ...detectedSubpaths,
    ...(options?.includeEntrypoints?.map((e) => formatEntrypointString(e, fs.packageName)) ?? []),
  ]);
  if (!options?.excludeEntrypoints) {
    return included;
  }
  return included.filter((entrypoint) => {
    return !options.excludeEntrypoints!.some((exclusion) => {
      if (typeof exclusion === "string") {
        return formatEntrypointString(exclusion, fs.packageName) === entrypoint;
      }
      return exclusion.test(entrypoint);
    });
  });
}

function formatEntrypointString(path: string, packageName: string) {
  return (
    path === "." || path.startsWith("./")
      ? path
      : path === packageName
      ? "."
      : path.startsWith(`${packageName}/`)
      ? `.${path.slice(packageName.length)}`
      : `./${path}`
  ).trim();
}

function getSubpaths(exportsObject: any): string[] {
  if (!exportsObject || typeof exportsObject !== "object" || Array.isArray(exportsObject)) {
    return [];
  }
  const keys = Object.keys(exportsObject);
  if (keys[0].startsWith(".")) {
    return keys;
  }
  return keys.flatMap((key) => getSubpaths(exportsObject[key]));
}

function getProxyDirectories(rootDir: string, fs: Package) {
  return fs
    .listFiles()
    .filter((f) => f.startsWith(rootDir) && f.endsWith("package.json"))
    .filter((f) => {
      try {
        const packageJson = JSON.parse(fs.readFile(f));
        return "main" in packageJson;
      } catch {
        return false;
      }
    })
    .map((f) => "." + f.slice(rootDir.length).slice(0, -`/package.json`.length))
    .filter((f) => f !== "./")
    .sort();
}

function getEntrypointInfo(
  packageName: string,
  fs: Package,
  hosts: CompilerHosts,
  options: CheckPackageOptions | undefined
): Record<string, EntrypointInfo> {
  const packageJson = JSON.parse(fs.readFile(`/node_modules/${packageName}/package.json`));
  const entrypoints = getEntrypoints(fs, packageJson.exports, options);
  const result: Record<string, EntrypointInfo> = {};
  for (const entrypoint of entrypoints) {
    const resolutions: Record<ResolutionKind, EntrypointResolutionAnalysis> = {
      node10: getEntrypointResolution(packageName, hosts.node10, "node10", entrypoint),
      "node16-cjs": getEntrypointResolution(packageName, hosts.node16, "node16-cjs", entrypoint),
      "node16-esm": getEntrypointResolution(packageName, hosts.node16, "node16-esm", entrypoint),
      bundler: getEntrypointResolution(packageName, hosts.bundler, "bundler", entrypoint),
    };
    result[entrypoint] = {
      subpath: entrypoint,
      resolutions,
      hasTypes: Object.values(resolutions).some((r) => r.resolution?.isTypeScript),
      isWildcard: !!resolutions.bundler.isWildcard,
    };
  }
  return result;
}

function getEntrypointResolution(
  packageName: string,
  host: CompilerHostWrapper,
  resolutionKind: ResolutionKind,
  entrypoint: string
): EntrypointResolutionAnalysis {
  if (entrypoint.includes("*")) {
    return { name: entrypoint, resolutionKind, isWildcard: true };
  }
  const moduleSpecifier = packageName + entrypoint.substring(1); // remove leading . before slash
  const importingFileName = resolutionKind === "node16-esm" ? "/index.mts" : "/index.ts";
  const resolutionMode = resolutionKind === "node16-esm" ? ts.ModuleKind.ESNext : ts.ModuleKind.CommonJS;

  const resolution = tryResolve();
  const implementationResolution =
    !resolution || ts.isDeclarationFileName(resolution.fileName) ? tryResolve(/*noDtsResolution*/ true) : undefined;

  const files = resolution
    ? host
        .createProgram([resolution.fileName])
        .getSourceFiles()
        .map((f) => f.fileName)
    : undefined;

  return {
    name: entrypoint,
    resolutionKind,
    resolution,
    implementationResolution,
    files,
  };

  function tryResolve(noDtsResolution?: boolean): Resolution | undefined {
    const { resolution, trace } = host.resolveModuleName(
      moduleSpecifier,
      importingFileName,
      resolutionMode,
      noDtsResolution
    );
    const fileName = resolution.resolvedModule?.resolvedFileName;
    if (!fileName) {
      return undefined;
    }

    return {
      fileName,
      moduleKind: host.getModuleKindForFile(fileName),
      isJson: resolution.resolvedModule.extension === ts.Extension.Json,
      isTypeScript: ts.hasTSFileExtension(resolution.resolvedModule.resolvedFileName),
      trace,
    };
  }
}

function unique<T>(array: readonly T[]): T[] {
  return array.filter((value, index) => array.indexOf(value) === index);
}
