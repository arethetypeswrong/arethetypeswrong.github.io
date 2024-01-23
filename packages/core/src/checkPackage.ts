import ts from "typescript";
import type { Package } from "./createPackage.js";
import checks from "./internal/checks/index.js";
import type { AnyCheck, CheckDependenciesContext } from "./internal/defineCheck.js";
import { CompilerHostWrapper, createCompilerHosts, type CompilerHosts } from "./multiCompilerHost.js";
import type {
  AnalysisTypes,
  BuildTool,
  CheckResult,
  EntrypointInfo,
  EntrypointResolutionAnalysis,
  ModuleKind,
  Problem,
  ProgramInfo,
  Resolution,
  ResolutionKind,
  ResolutionOption,
} from "./types.js";
import { allBuildTools, getResolutionKinds, getResolutionOption, visitResolutions } from "./utils.js";

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
  const types: AnalysisTypes | false = pkg.typesPackage
    ? {
        kind: "@types",
        ...pkg.typesPackage,
        definitelyTypedUrl: JSON.parse(pkg.readFile(`/node_modules/${pkg.typesPackage.packageName}/package.json`))
          .homepage,
      }
    : pkg.containsTypes()
    ? { kind: "included" }
    : false;
  const { packageName, packageVersion } = pkg;
  if (!types) {
    return { packageName, packageVersion, types };
  }

  const hosts = createCompilerHosts(pkg);
  const entrypointResolutions = getEntrypointInfo(packageName, pkg, hosts, options);
  const programInfo: Record<ResolutionOption, ProgramInfo> = {
    node10: {},
    node16: { moduleKinds: getModuleKinds(entrypointResolutions, "node16", hosts) },
    bundler: {},
  };

  const problems: Problem[] = [];
  const problemIdsToIndices = new Map<string, number[]>();
  visitResolutions(entrypointResolutions, (analysis, info) => {
    for (const check of checks) {
      const context = {
        pkg,
        hosts,
        entrypoints: entrypointResolutions,
        programInfo,
        subpath: info.subpath,
        resolutionKind: analysis.resolutionKind,
        resolutionOption: getResolutionOption(analysis.resolutionKind),
        fileName: undefined,
      };
      if (check.enumerateFiles) {
        for (const fileName of analysis.files ?? []) {
          runCheck(check, { ...context, fileName }, analysis);
        }
        if (analysis.implementationResolution) {
          runCheck(check, { ...context, fileName: analysis.implementationResolution.fileName }, analysis);
        }
      } else {
        runCheck(check, context, analysis);
      }
    }
  });

  return {
    packageName,
    packageVersion,
    types,
    buildTools: getBuildTools(JSON.parse(pkg.readFile(`/node_modules/${packageName}/package.json`))),
    entrypoints: entrypointResolutions,
    programInfo,
    problems,
  };

  function runCheck(
    check: AnyCheck,
    context: CheckDependenciesContext<boolean>,
    analysis: EntrypointResolutionAnalysis,
  ) {
    const dependencies = check.dependencies(context);
    const id =
      check.name +
      JSON.stringify(dependencies, (_, value) => {
        if (typeof value === "function") {
          throw new Error("Encountered unexpected function in check dependencies");
        }
        return value;
      });
    let indices = problemIdsToIndices.get(id);
    if (indices) {
      (analysis.visibleProblems ??= []).push(...indices);
    } else {
      indices = [];
      const checkProblems = check.execute(dependencies, context);
      for (const problem of Array.isArray(checkProblems) ? checkProblems : checkProblems ? [checkProblems] : []) {
        indices.push(problems.length);
        problems.push(problem);
      }
      problemIdsToIndices.set(id, indices);
      (analysis.visibleProblems ??= []).push(...indices);
    }
  }
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
        return "main" in packageJson && (!packageJson.name || packageJson.name.startsWith(fs.packageName));
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

function getBuildTools(packageJson: any): Partial<Record<BuildTool, string>> {
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

function getModuleKinds(
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
