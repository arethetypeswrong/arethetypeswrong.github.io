import ts from "typescript";
import { fetchTarballHost } from "./fetchTarballHost.js";
import type {
  Host,
  Analysis,
  FS,
  ResolutionKind,
  EntrypointResolutionAnalysis,
  TraceCollector,
  Resolution,
  SymbolTable,
  ModuleKind,
} from "./types.js";

type SourceFileCache = Map<string, { symbolTable: SymbolTable | false; sourceFile: ts.SourceFile }>;

export async function checkTgz(tgz: Uint8Array, host: Host = fetchTarballHost): Promise<Analysis> {
  const packageFS = await host.createPackageFSFromTarball(tgz);
  return checkPackageWorker(packageFS);
}

export async function checkPackage(
  packageName: string,
  packageVersion?: string,
  host: Host = fetchTarballHost
): Promise<Analysis> {
  const packageFS = await host.createPackageFS(packageName, packageVersion);
  return checkPackageWorker(packageFS);
}

async function checkPackageWorker(packageFS: FS): Promise<Analysis> {
  const files = packageFS.listFiles();
  const containsTypes = files.some(ts.hasTSFileExtension);
  const parts = files[0].split("/");
  let packageName = parts[2];
  if (packageName.startsWith("@")) {
    packageName = parts.slice(2, 4).join("/");
  }
  const packageJsonContent = JSON.parse(packageFS.readFile(`/node_modules/${packageName}/package.json`));
  const packageVersion = packageJsonContent.version;
  if (!containsTypes) {
    return { packageName, packageVersion, containsTypes };
  }

  const entrypoints = checkEntrypoints(packageName, packageFS);
  return { packageName, packageVersion, containsTypes, entrypointResolutions: entrypoints };
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

function checkEntrypoints(
  packageName: string,
  fs: FS
): Record<string, Record<ResolutionKind, EntrypointResolutionAnalysis>> {
  const packageJson = JSON.parse(fs.readFile(`/node_modules/${packageName}/package.json`));
  const subpaths = getSubpaths(packageJson.exports);
  const entrypoints = subpaths.length ? subpaths : ["."];
  const result: Record<string, Record<ResolutionKind, EntrypointResolutionAnalysis>> = {};
  const sourceFileCache: SourceFileCache = new Map();
  for (const entrypoint of entrypoints) {
    result[entrypoint] = {
      node10: checkEntrypointTyped(packageName, fs, "node10", entrypoint, sourceFileCache),
      "node16-cjs": checkEntrypointTyped(packageName, fs, "node16-cjs", entrypoint, sourceFileCache),
      "node16-esm": checkEntrypointTyped(packageName, fs, "node16-esm", entrypoint, sourceFileCache),
      bundler: checkEntrypointTyped(packageName, fs, "bundler", entrypoint, sourceFileCache),
    };
  }
  return result;
}

function createModuleResolutionHost(fs: FS, trace: (message: string) => void): ts.ModuleResolutionHost {
  return {
    ...fs,
    trace,
  };
}

function createTraceCollector(): TraceCollector {
  const traces: string[] = [];
  return {
    trace: (message: string) => traces.push(message),
    read: () => {
      const result = traces.slice();
      traces.length = 0;
      return result;
    },
  };
}

function checkEntrypointTyped(
  packageName: string,
  fs: FS,
  resolutionKind: ResolutionKind,
  entrypoint: string,
  sourceFileCache: SourceFileCache
): EntrypointResolutionAnalysis {
  if (entrypoint.includes("*")) {
    return { name: entrypoint, isWildcard: true, trace: [] };
  }
  const moduleSpecifier = packageName + entrypoint.substring(1); // remove leading . before slash
  const importingFileName = resolutionKind === "node16-esm" ? "/index.mts" : "/index.ts";
  const moduleResolution =
    resolutionKind === "node10"
      ? // @ts-expect-error
        ts.ModuleResolutionKind.Node10
      : resolutionKind === "node16-cjs" || resolutionKind === "node16-esm"
      ? ts.ModuleResolutionKind.Node16
      : // @ts-expect-error
        ts.ModuleResolutionKind.Bundler;
  const resolutionMode = resolutionKind === "node16-esm" ? ts.ModuleKind.ESNext : ts.ModuleKind.CommonJS;
  const traceCollector = createTraceCollector();
  const resolutionHost = createModuleResolutionHost(fs, traceCollector.trace);

  const resolution = tryResolve();
  const implementationResolution =
    !resolution || ts.isDeclarationFileName(resolution.fileName) ? tryResolve(/*noDtsResolution*/ true) : undefined;

  return {
    name: entrypoint,
    resolution,
    implementationResolution,
    trace: traceCollector.read(),
  };

  function tryResolve(noDtsResolution?: boolean): Resolution | undefined {
    let moduleKind: ModuleKind | undefined;
    const compilerOptions = {
      resolveJsonModule: true,
      moduleResolution,
      traceResolution: !noDtsResolution,
      noDtsResolution,
    };
    const resolution = ts.resolveModuleName(
      moduleSpecifier,
      importingFileName,
      compilerOptions,
      resolutionHost,
      undefined,
      undefined,
      resolutionMode
    );
    const fileName = resolution.resolvedModule?.resolvedFileName;
    if (!fileName) {
      return undefined;
    }

    let sourceInfo = sourceFileCache.get(fileName);
    if (!sourceInfo) {
      const sourceText = fs.readFile(fileName);
      const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, /*setParentNodes*/ false);
      sourceFileCache.set(
        fileName,
        (sourceInfo = {
          sourceFile,
          symbolTable: getModuleSymbolTable(sourceFile),
        })
      );
    }
    if (resolutionKind === "node16-cjs" || resolutionKind === "node16-esm") {
      const kind = ts.getImpliedNodeFormatForFile(
        resolution.resolvedModule.resolvedFileName as ts.Path,
        /*packageJsonInfoCache*/ undefined,
        fs,
        compilerOptions
      );
      if (kind) {
        const isExtension =
          resolution.resolvedModule.extension === ts.Extension.Cjs ||
          resolution.resolvedModule.extension === ts.Extension.Cts ||
          resolution.resolvedModule.extension === ts.Extension.Dcts ||
          resolution.resolvedModule.extension === ts.Extension.Mjs ||
          resolution.resolvedModule.extension === ts.Extension.Mts ||
          resolution.resolvedModule.extension === ts.Extension.Dmts;
        const reasonPackageJsonInfo = isExtension
          ? undefined
          : ts.getPackageScopeForPath(
              resolution.resolvedModule.resolvedFileName,
              ts.getTemporaryModuleResolutionState(undefined, resolutionHost, compilerOptions)
            );
        const reasonFileName = isExtension
          ? resolution.resolvedModule.resolvedFileName
          : reasonPackageJsonInfo
          ? reasonPackageJsonInfo.packageDirectory + "/package.json"
          : resolution.resolvedModule.resolvedFileName;
        const reasonPackageJsonType = reasonPackageJsonInfo?.contents?.packageJsonContent.type;
        moduleKind = {
          detectedKind: kind,
          detectedReason: isExtension ? "extension" : reasonPackageJsonType ? "type" : "no:type",
          reasonFileName,
          syntax: sourceInfo?.sourceFile.externalModuleIndicator
            ? ts.ModuleKind.ESNext
            : sourceInfo?.sourceFile.commonJsModuleIndicator
            ? ts.ModuleKind.CommonJS
            : undefined,
        };
      }
    }
    return {
      fileName,
      moduleKind,
      isJson: resolution.resolvedModule.extension === ts.Extension.Json,
      isTypeScript: ts.hasTSFileExtension(resolution.resolvedModule.resolvedFileName),
      exports: sourceInfo?.symbolTable,
    };
  }
}

function getModuleSymbolTable(sourceFile: ts.SourceFile): SymbolTable | false {
  ts.bindSourceFile(sourceFile, { allowJs: true, checkJs: true, target: ts.ScriptTarget.Latest });
  if (!sourceFile.symbol) {
    return false;
  }
  const symbolTable: SymbolTable = {};
  sourceFile.symbol.exports?.forEach((symbol, escapedName) => {
    const name = ts.unescapeLeadingUnderscores(escapedName);
    symbolTable[name] = {
      name,
      flags: symbol.flags,
      valueDeclarationRange: symbol.valueDeclaration && [
        symbol.valueDeclaration.getStart(sourceFile),
        symbol.valueDeclaration.end,
      ],
    };
  });
  return symbolTable;
}
