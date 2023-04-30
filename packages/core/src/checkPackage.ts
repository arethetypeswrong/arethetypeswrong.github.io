import ts from "typescript";
import { fetchTarballHost } from "./fetchTarballHost.js";
import type {
  Host,
  Analysis,
  FS,
  ResolutionKind,
  EntrypointResolutionAnalysis,
  Resolution,
  SymbolTable,
  ModuleKind,
  InternalResolutionError,
  ResolutionOption,
  SourceFileInfo,
} from "./types.js";
import { createMultiCompilerHost, type MultiCompilerHost } from "./multiCompilerHost.js";

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

  const host = createMultiCompilerHost(packageFS);
  const entrypoints = checkEntrypoints(packageName, packageFS, host);

  return {
    packageName,
    packageVersion,
    containsTypes,
    entrypointResolutions: entrypoints,
    internalResolutionErrors: getInternalResolutionErrors(packageName, packageFS, host),
    sourceFileInfo: getSourceFileInfo(packageFS, host),
  };
}

function getInternalResolutionErrors(
  packageName: string,
  packageFS: FS,
  host: MultiCompilerHost
): Record<ResolutionOption, InternalResolutionError[]> {
  const result: Record<ResolutionOption, InternalResolutionError[]> = {
    node10: [],
    node16: [],
    bundler: [],
  };

  const fileNames = packageFS.listFiles();
  for (const resolutionOption of ["node10", "node16", "bundler"] as const) {
    for (const fileName of fileNames) {
      if (!ts.hasTSFileExtension(fileName)) {
        continue;
      }
      const sourceFile = host.getSourceFile(fileName, resolutionOption)!;
      const imports = sourceFile.statements.filter(ts.or(ts.isImportDeclaration, ts.isImportEqualsDeclaration));
      for (const importDeclaration of imports) {
        const moduleSpecifier = ts.tryGetModuleSpecifierFromDeclaration(importDeclaration);
        if (!moduleSpecifier) {
          continue;
        }

        const reference = moduleSpecifier.text;
        if (
          reference !== packageName &&
          !reference.startsWith(`${packageName}/`) &&
          reference[0] !== "#" &&
          !ts.pathIsRelative(reference)
        ) {
          // Probably a reference to something we'd have to npm install.
          // These can definitely be errors, but I'm not installing a whole
          // graph for now.
          continue;
        }

        const resolutionMode = ts.getModeForUsageLocation(sourceFile, moduleSpecifier);
        const { resolution, trace } = host.resolveModuleName(reference, fileName, resolutionOption);

        if (!resolution.resolvedModule) {
          result[resolutionOption].push({
            fileName,
            moduleSpecifier: reference,
            pos: moduleSpecifier.pos,
            end: moduleSpecifier.end,
            resolutionMode,
            trace,
          });
        }
      }
    }
  }
  return result;
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
  fs: FS,
  host: MultiCompilerHost
): Record<string, Record<ResolutionKind, EntrypointResolutionAnalysis>> {
  const packageJson = JSON.parse(fs.readFile(`/node_modules/${packageName}/package.json`));
  const subpaths = getSubpaths(packageJson.exports);
  const entrypoints = subpaths.length ? subpaths : ["."];
  const result: Record<string, Record<ResolutionKind, EntrypointResolutionAnalysis>> = {};
  for (const entrypoint of entrypoints) {
    result[entrypoint] = {
      node10: checkEntrypointTyped(packageName, "node10", entrypoint, host),
      "node16-cjs": checkEntrypointTyped(packageName, "node16-cjs", entrypoint, host),
      "node16-esm": checkEntrypointTyped(packageName, "node16-esm", entrypoint, host),
      bundler: checkEntrypointTyped(packageName, "bundler", entrypoint, host),
    };
  }
  return result;
}

function checkEntrypointTyped(
  packageName: string,
  resolutionKind: ResolutionKind,
  entrypoint: string,
  host: MultiCompilerHost
): EntrypointResolutionAnalysis {
  if (entrypoint.includes("*")) {
    return { name: entrypoint, isWildcard: true };
  }
  const moduleSpecifier = packageName + entrypoint.substring(1); // remove leading . before slash
  const importingFileName = resolutionKind === "node16-esm" ? "/index.mts" : "/index.ts";
  const moduleResolution = resolutionKind === "node10" ? "node10" : resolutionKind === "bundler" ? "bundler" : "node16";
  const resolutionMode = resolutionKind === "node16-esm" ? ts.ModuleKind.ESNext : ts.ModuleKind.CommonJS;

  const resolution = tryResolve();
  const implementationResolution =
    !resolution || ts.isDeclarationFileName(resolution.fileName) ? tryResolve(/*noDtsResolution*/ true) : undefined;

  return {
    name: entrypoint,
    resolution,
    implementationResolution,
  };

  function tryResolve(noDtsResolution?: boolean): Resolution | undefined {
    let moduleKind: ModuleKind | undefined;
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

    if (resolutionKind === "node16-cjs" || resolutionKind === "node16-esm") {
      const kind = host.getImpliedNodeFormatForFile(fileName, moduleResolution);
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
          : host.getPackageScopeForPath(resolution.resolvedModule.resolvedFileName);
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
        };
      }
    }
    return {
      fileName,
      moduleKind,
      isJson: resolution.resolvedModule.extension === ts.Extension.Json,
      isTypeScript: ts.hasTSFileExtension(resolution.resolvedModule.resolvedFileName),
      trace,
    };
  }
}

function getSourceFileInfo(fileName: string, host: MultiCompilerHost): SourceFileInfo {
  const sourceFile = host.getSourceFile(fileName)!;
  const symbolTable = getModuleSymbolTable(sourceFile);
  const syntax = sourceFile.externalModuleIndicator
    ? ts.ModuleKind.ESNext
    : sourceFile.commonJsModuleIndicator
    ? ts.ModuleKind.CommonJS
    : undefined;
  return {
    syntax,
    exports: symbolTable,
  };
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
