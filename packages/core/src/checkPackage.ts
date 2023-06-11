import ts from "typescript";
import { fetchTarballHost } from "./fetchTarballHost.js";
import type {
  Host,
  CheckResult,
  FS,
  ResolutionKind,
  EntrypointResolutionAnalysis,
  Resolution,
  EntrypointInfo,
} from "./types.js";
import { createMultiCompilerHost, type MultiCompilerHost } from "./multiCompilerHost.js";
import { getEntrypointResolutionProblems } from "./checks/entrypointResolutionProblems.js";
import { getResolutionBasedFileProblems } from "./checks/resolutionBasedFileProblems.js";
import { getFileProblems } from "./checks/fileProblems.js";

export async function checkTgz(tgz: Uint8Array, host: Host = fetchTarballHost): Promise<CheckResult> {
  const packageFS = await host.createPackageFSFromTarball(tgz);
  return checkPackageWorker(packageFS);
}

export async function checkPackage(
  packageName: string,
  packageVersion?: string,
  host: Host = fetchTarballHost
): Promise<CheckResult> {
  const packageFS = await host.createPackageFS(packageName, packageVersion);
  return checkPackageWorker(packageFS);
}

async function checkPackageWorker(packageFS: FS): Promise<CheckResult> {
  const files = packageFS.listFiles();
  const types = files.some(ts.hasTSFileExtension) ? "included" : false;
  const parts = files[0].split("/");
  let packageName = parts[2];
  if (packageName.startsWith("@")) {
    packageName = parts.slice(2, 4).join("/");
  }
  const packageJsonContent = JSON.parse(packageFS.readFile(`/node_modules/${packageName}/package.json`));
  const packageVersion = packageJsonContent.version;
  if (!types) {
    return { packageName, packageVersion, types };
  }

  const host = createMultiCompilerHost(packageFS);
  const entrypointResolutions = getEntrypointInfo(packageName, packageFS, host);
  const entrypointResolutionProblems = getEntrypointResolutionProblems(entrypointResolutions, host);
  const resolutionBasedFileProblems = getResolutionBasedFileProblems(packageName, entrypointResolutions, host);
  const fileProblems = getFileProblems(entrypointResolutions, host);

  return {
    packageName,
    packageVersion,
    types,
    entrypoints: entrypointResolutions,
    problems: [...entrypointResolutionProblems, ...resolutionBasedFileProblems, ...fileProblems],
  };
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

function getEntrypointInfo(packageName: string, fs: FS, host: MultiCompilerHost): Record<string, EntrypointInfo> {
  const packageJson = JSON.parse(fs.readFile(`/node_modules/${packageName}/package.json`));
  const subpaths = getSubpaths(packageJson.exports);
  const entrypoints = subpaths.length ? subpaths : ["."];
  const result: Record<string, EntrypointInfo> = {};
  for (const entrypoint of entrypoints) {
    const resolutions: Record<ResolutionKind, EntrypointResolutionAnalysis> = {
      node10: getEntrypointResolution(packageName, "node10", entrypoint, host),
      "node16-cjs": getEntrypointResolution(packageName, "node16-cjs", entrypoint, host),
      "node16-esm": getEntrypointResolution(packageName, "node16-esm", entrypoint, host),
      bundler: getEntrypointResolution(packageName, "bundler", entrypoint, host),
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
  resolutionKind: ResolutionKind,
  entrypoint: string,
  host: MultiCompilerHost
): EntrypointResolutionAnalysis {
  if (entrypoint.includes("*")) {
    return { name: entrypoint, resolutionKind, isWildcard: true };
  }
  const moduleSpecifier = packageName + entrypoint.substring(1); // remove leading . before slash
  const importingFileName = resolutionKind === "node16-esm" ? "/index.mts" : "/index.ts";
  const moduleResolution = resolutionKind === "node10" ? "node10" : resolutionKind === "bundler" ? "bundler" : "node16";
  const resolutionMode = resolutionKind === "node16-esm" ? ts.ModuleKind.ESNext : ts.ModuleKind.CommonJS;

  const resolution = tryResolve();
  const implementationResolution =
    !resolution || ts.isDeclarationFileName(resolution.fileName) ? tryResolve(/*noDtsResolution*/ true) : undefined;

  const files = resolution
    ? host
        .createProgram(moduleResolution, [resolution.fileName])
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
      moduleResolution,
      resolutionMode,
      noDtsResolution
    );
    const fileName = resolution.resolvedModule?.resolvedFileName;
    if (!fileName) {
      return undefined;
    }

    return {
      fileName,
      moduleKind: host.getModuleKindForFile(fileName, moduleResolution),
      isJson: resolution.resolvedModule.extension === ts.Extension.Json,
      isTypeScript: ts.hasTSFileExtension(resolution.resolvedModule.resolvedFileName),
      trace,
    };
  }
}
