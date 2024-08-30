import ts from "typescript";
import type { Package } from "../createPackage.ts";
import { CompilerHostWrapper, type CompilerHosts } from "./multiCompilerHost.ts";
import type {
  BuildTool,
  EntrypointInfo,
  EntrypointResolutionAnalysis,
  ModuleKind,
  Resolution,
  ResolutionKind,
  ResolutionOption,
} from "../types.ts";
import { allBuildTools, getResolutionKinds } from "../utils.ts";
import type { CheckPackageOptions } from "../checkPackage.ts";

const extensions = new Set([".jsx", ".tsx", ".js", ".ts", ".mjs", ".cjs", ".mts", ".cjs"]);

function getEntrypoints(fs: Package, exportsObject: unknown, options: CheckPackageOptions | undefined): string[] {
  if (options?.entrypoints) {
    return options.entrypoints.map((e) => formatEntrypointString(e, fs.packageName));
  }
  if (exportsObject === undefined && fs) {
    const rootDir = `/node_modules/${fs.packageName}`;
    const proxies = getProxyDirectories(rootDir, fs);
    if (proxies.length === 0) {
      if (options?.entrypointsLegacy) {
        return fs
          .listFiles()
          .filter((f) => !ts.isDeclarationFileName(f) && extensions.has(f.slice(f.lastIndexOf("."))))
          .map((f) => "." + f.slice(rootDir.length));
      }
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
        return "main" in packageJson && (!packageJson.name || packageJson.name.startsWith(fs.packageName));
      } catch {
        return false;
      }
    })
    .map((f) => "." + f.slice(rootDir.length).slice(0, -`/package.json`.length))
    .filter((f) => f !== "./")
    .sort();
}
export function getEntrypointInfo(
  packageName: string,
  fs: Package,
  hosts: CompilerHosts,
  options: CheckPackageOptions | undefined,
): Record<string, EntrypointInfo> {
  const packageJson = JSON.parse(fs.readFile(`/node_modules/${packageName}/package.json`));
  let entrypoints = getEntrypoints(fs, packageJson.exports, options);
  if (fs.typesPackage) {
    const typesPackageJson = JSON.parse(fs.readFile(`/node_modules/${fs.typesPackage.packageName}/package.json`));
    const typesEntrypoints = getEntrypoints(fs, typesPackageJson.exports, options);
    entrypoints = unique([...entrypoints, ...typesEntrypoints]);
  }
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
  entrypoint: string,
): EntrypointResolutionAnalysis {
  if (entrypoint.includes("*")) {
    return { name: entrypoint, resolutionKind, isWildcard: true };
  }
  const moduleSpecifier = packageName + entrypoint.substring(1); // remove leading . before slash
  const importingFileName = resolutionKind === "node16-esm" ? "/index.mts" : "/index.ts";
  const resolutionMode =
    resolutionKind === "node16-esm"
      ? ts.ModuleKind.ESNext
      : resolutionKind === "node16-cjs"
      ? ts.ModuleKind.CommonJS
      : undefined;
  const resolution = tryResolve();
  const implementationResolution = tryResolve(/*noDtsResolution*/ true);
  const files = resolution
    ? host
        .createPrimaryProgram(resolution.fileName)
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
      noDtsResolution,
    );
    const fileName = resolution.resolvedModule?.resolvedFileName;
    if (!fileName) {
      return undefined;
    }

    return {
      fileName,
      isJson: resolution.resolvedModule.extension === ts.Extension.Json,
      isTypeScript: ts.hasTSFileExtension(resolution.resolvedModule.resolvedFileName),
      trace,
    };
  }
}
function unique<T>(array: readonly T[]): T[] {
  return array.filter((value, index) => array.indexOf(value) === index);
}
export function getBuildTools(packageJson: any): Partial<Record<BuildTool, string>> {
  if (!packageJson.devDependencies) {
    return {};
  }
  const result: Partial<Record<BuildTool, string>> = {};
  for (const buildTool of allBuildTools) {
    if (buildTool in packageJson.devDependencies) {
      result[buildTool] = packageJson.devDependencies[buildTool];
    }
  }
  return result;
}
export function getModuleKinds(
  entrypoints: Record<string, EntrypointInfo>,
  resolutionOption: ResolutionOption,
  hosts: CompilerHosts,
): Record<string, ModuleKind> {
  const host = hosts[resolutionOption];
  const result: Record<string, ModuleKind> = {};
  for (const resolutionKind of getResolutionKinds(resolutionOption)) {
    for (const entrypoint of Object.values(entrypoints)) {
      const resolution = entrypoint.resolutions[resolutionKind];
      for (const fileName of resolution.files ?? []) {
        if (!result[fileName]) {
          result[fileName] = host.getModuleKindForFile(fileName)!;
        }
      }
      if (resolution.implementationResolution) {
        const fileName = resolution.implementationResolution.fileName;
        if (!result[fileName]) {
          result[fileName] = host.getModuleKindForFile(fileName)!;
        }
      }
    }
  }
  return result;
}
