import ts from "typescript";
import { getEntrypointResolutionProblems } from "./checks/entrypointResolutionProblems.js";
import { getFileProblems } from "./checks/fileProblems.js";
import { getResolutionBasedFileProblems } from "./checks/resolutionBasedFileProblems.js";
import type { Package } from "./createPackage.js";
import { createMultiCompilerHost, type MultiCompilerHost } from "./multiCompilerHost.js";
import type { CheckResult, EntrypointInfo, EntrypointResolutionAnalysis, Resolution, ResolutionKind } from "./types.js";

export async function checkPackage(pkg: Package): Promise<CheckResult> {
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

  const host = createMultiCompilerHost(pkg);
  const entrypointResolutions = getEntrypointInfo(packageName, pkg, host);
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
    .filter((f) => f !== "./");
}

function getEntrypointInfo(packageName: string, fs: Package, host: MultiCompilerHost): Record<string, EntrypointInfo> {
  const packageJson = JSON.parse(fs.readFile(`/node_modules/${packageName}/package.json`));
  const subpaths = getSubpaths(packageJson.exports);
  const entrypoints = subpaths.length ? subpaths : ["."];
  if (!packageJson.exports) {
    entrypoints.push(...getProxyDirectories(`/node_modules/${packageName}`, fs));
  }
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
