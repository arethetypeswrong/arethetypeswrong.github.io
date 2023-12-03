import ts from "typescript";
import type { ModuleKind } from "./types.js";
import type { Package } from "./createPackage.js";

export interface ResolveModuleNameResult {
  resolution: ts.ResolvedModuleWithFailedLookupLocations;
  trace: string[];
}

export interface CompilerHosts {
  node10: CompilerHostWrapper;
  node16: CompilerHostWrapper;
  bundler: CompilerHostWrapper;
  findHostForFiles(files: string[]): CompilerHostWrapper | undefined;
}

export function createCompilerHosts(fs: Package): CompilerHosts {
  const node10 = new CompilerHostWrapper(fs, ts.ModuleResolutionKind.Node10, ts.ModuleKind.CommonJS);
  const node16 = new CompilerHostWrapper(fs, ts.ModuleResolutionKind.Node16, ts.ModuleKind.Node16);
  const bundler = new CompilerHostWrapper(fs, ts.ModuleResolutionKind.Bundler, ts.ModuleKind.ESNext);

  return {
    node10,
    node16,
    bundler,
    findHostForFiles(files: string[]) {
      for (const host of [node10, node16, bundler]) {
        if (files.every((f) => host.getSourceFileFromCache(f) !== undefined)) {
          return host;
        }
      }
    },
  };
}

const getCanonicalFileName = ts.createGetCanonicalFileName(false);
const toPath = (fileName: string) => ts.toPath(fileName, "/", getCanonicalFileName);

export class CompilerHostWrapper {
  private compilerHost: ts.CompilerHost;
  private compilerOptions: ts.CompilerOptions;
  private normalModuleResolutionCache: ts.ModuleResolutionCache;
  private noDtsResolutionModuleResolutionCache: ts.ModuleResolutionCache;

  private moduleResolutionCache: Record<
    /*FromFileName*/ string,
    Record</*Key*/ string, { resolution: ts.ResolvedModuleWithFailedLookupLocations; trace: string[] }>
  > = {};
  private traceCollector: TraceCollector = new TraceCollector();
  private sourceFileCache: Map<ts.Path, ts.SourceFile> = new Map();
  private resolvedModules: Exclude<ts.Program["resolvedModules"], undefined> = new Map();
  private languageVersion = ts.ScriptTarget.Latest;

  constructor(fs: Package, moduleResolution: ts.ModuleResolutionKind, moduleKind: ts.ModuleKind) {
    this.compilerOptions = {
      moduleResolution,
      module: moduleKind,
      // So `sourceFile.externalModuleIndicator` is set to a node
      moduleDetection: ts.ModuleDetectionKind.Legacy,
      target: ts.ScriptTarget.Latest,
      resolveJsonModule: true,
      traceResolution: true,
    };
    this.normalModuleResolutionCache = ts.createModuleResolutionCache("/", getCanonicalFileName, this.compilerOptions);
    this.noDtsResolutionModuleResolutionCache = ts.createModuleResolutionCache(
      "/",
      getCanonicalFileName,
      this.compilerOptions,
    );
    this.compilerHost = this.createCompilerHost(fs, this.sourceFileCache);
  }

  getSourceFile(fileName: string): ts.SourceFile | undefined {
    return this.compilerHost.getSourceFile(fileName, this.languageVersion);
  }

  getSourceFileFromCache(fileName: string): ts.SourceFile | undefined {
    return this.sourceFileCache.get(toPath(fileName));
  }

  getModuleKindForFile(fileName: string): ModuleKind | undefined {
    const kind = this.getImpliedNodeFormatForFile(fileName);
    if (kind) {
      const extension = ts.getAnyExtensionFromPath(fileName);
      const isExtension =
        extension === ts.Extension.Cjs ||
        extension === ts.Extension.Cts ||
        extension === ts.Extension.Dcts ||
        extension === ts.Extension.Mjs ||
        extension === ts.Extension.Mts ||
        extension === ts.Extension.Dmts;
      const reasonPackageJsonInfo = isExtension ? undefined : this.getPackageScopeForPath(fileName);
      const reasonFileName = isExtension
        ? fileName
        : reasonPackageJsonInfo
        ? reasonPackageJsonInfo.packageDirectory + "/package.json"
        : fileName;
      const reasonPackageJsonType = reasonPackageJsonInfo?.contents?.packageJsonContent.type;
      return {
        detectedKind: kind,
        detectedReason: isExtension ? "extension" : reasonPackageJsonType ? "type" : "no:type",
        reasonFileName,
      };
    }
  }

  resolveModuleName(
    moduleName: string,
    containingFile: string,
    resolutionMode?: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS,
    noDtsResolution?: boolean,
    allowJs?: boolean,
  ): ResolveModuleNameResult {
    const moduleKey = this.getModuleKey(moduleName, resolutionMode, noDtsResolution, allowJs);
    if (this.moduleResolutionCache[containingFile]?.[moduleKey]) {
      const { resolution, trace } = this.moduleResolutionCache[containingFile][moduleKey];
      return {
        resolution,
        trace,
      };
    }
    this.traceCollector.clear();
    const resolution = ts.resolveModuleName(
      moduleName,
      containingFile,
      noDtsResolution ? { ...this.compilerOptions, noDtsResolution, allowJs } : this.compilerOptions,
      this.compilerHost,
      noDtsResolution ? this.noDtsResolutionModuleResolutionCache : this.normalModuleResolutionCache,
      /*redirectedReference*/ undefined,
      resolutionMode,
    );
    const trace = this.traceCollector.read();
    if (!this.moduleResolutionCache[containingFile]?.[moduleKey]) {
      (this.moduleResolutionCache[containingFile] ??= {})[moduleKey] = { resolution, trace };
    }
    return {
      resolution,
      trace,
    };
  }

  getTrace(
    fromFileName: string,
    moduleSpecifier: string,
    resolutionMode: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS | undefined,
  ): string[] | undefined {
    return this.moduleResolutionCache[fromFileName]?.[
      this.getModuleKey(moduleSpecifier, resolutionMode, /*noDtsResolution*/ undefined, /*allowJs*/ undefined)
    ]?.trace;
  }

  private getModuleKey(
    moduleSpecifier: string,
    resolutionMode: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS | undefined,
    noDtsResolution: boolean | undefined,
    allowJs: boolean | undefined,
  ) {
    return `${resolutionMode ?? 1}:${+!!noDtsResolution}:${+!!allowJs}:${moduleSpecifier}`;
  }

  createPrimaryProgram(rootName: string) {
    const program = ts.createProgram({
      rootNames: [rootName],
      options: this.compilerOptions,
      host: this.compilerHost,
    });

    program.resolvedModules?.forEach((cache, path) => {
      let ownCache = this.resolvedModules.get(path);
      if (!ownCache) {
        this.resolvedModules.set(path, (ownCache = ts.createModeAwareCache()));
      }
      cache.forEach((resolution, key, mode) => {
        ownCache!.set(key, mode, resolution);
      });
    });

    return program;
  }

  createAuxiliaryProgram(rootNames: string[], extraOptions?: ts.CompilerOptions): ts.Program {
    if (
      extraOptions &&
      ts.changesAffectModuleResolution(
        // allowJs and noDtsResolution are part of the cache key, but any other resolution-affecting options
        // are assumed to be constant for the host.
        {
          ...this.compilerOptions,
          allowJs: extraOptions.allowJs,
          checkJs: extraOptions.checkJs,
          noDtsResolution: extraOptions.noDtsResolution,
        },
        { ...this.compilerOptions, ...extraOptions },
      )
    ) {
      throw new Error("Cannot override resolution-affecting options for host due to potential cache polution");
    }
    return ts.createProgram({
      rootNames,
      options: extraOptions ? { ...this.compilerOptions, ...extraOptions } : this.compilerOptions,
      host: this.compilerHost,
    });
  }

  getResolvedModule(sourceFile: ts.SourceFile, moduleName: string, resolutionMode: ts.ResolutionMode) {
    return this.resolvedModules.get(sourceFile.path)?.get(moduleName, resolutionMode);
  }

  private createCompilerHost(fs: Package, sourceFileCache: Map<ts.Path, ts.SourceFile>): ts.CompilerHost {
    return {
      fileExists: fs.fileExists.bind(fs),
      readFile: fs.readFile.bind(fs),
      directoryExists: fs.directoryExists.bind(fs),
      getSourceFile: (fileName) => {
        const path = toPath(fileName);
        const cached = sourceFileCache.get(path);
        if (cached) {
          return cached;
        }
        const content = fileName.startsWith("/node_modules/typescript/lib") ? "" : fs.tryReadFile(fileName);
        if (content === undefined) {
          return undefined;
        }

        const sourceFile = ts.createSourceFile(
          fileName,
          content,
          {
            languageVersion: this.languageVersion,
            impliedNodeFormat: this.getImpliedNodeFormatForFile(fileName),
          },
          /*setParentNodes*/ true,
        );
        sourceFileCache.set(path, sourceFile);
        return sourceFile;
      },
      getDefaultLibFileName: () => "/node_modules/typescript/lib/lib.d.ts",
      getCurrentDirectory: () => "/",
      writeFile: () => {
        throw new Error("Not implemented");
      },
      getCanonicalFileName,
      useCaseSensitiveFileNames: () => false,
      getNewLine: () => "\n",
      trace: this.traceCollector.trace,
      resolveModuleNameLiterals: (
        moduleLiterals,
        containingFile,
        _redirectedReference,
        options,
        containingSourceFile,
      ) => {
        return moduleLiterals.map(
          (literal) =>
            this.resolveModuleName(
              literal.text,
              containingFile,
              ts.getModeForUsageLocation(containingSourceFile, literal),
              options.noDtsResolution,
            ).resolution,
        );
      },
    };
  }

  private getImpliedNodeFormatForFile(fileName: string): ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS | undefined {
    return ts.getImpliedNodeFormatForFile(
      toPath(fileName),
      this.normalModuleResolutionCache.getPackageJsonInfoCache(),
      this.compilerHost,
      this.compilerOptions,
    );
  }

  private getPackageScopeForPath(fileName: string): ts.PackageJsonInfo | undefined {
    return ts.getPackageScopeForPath(
      fileName,
      ts.getTemporaryModuleResolutionState(
        // TODO: consider always using the node16 cache because package.json should be a hit
        this.normalModuleResolutionCache.getPackageJsonInfoCache(),
        this.compilerHost,
        this.compilerOptions,
      ),
    );
  }
}

class TraceCollector {
  private traces: string[] = [];

  trace = (message: string) => {
    this.traces.push(message);
  };
  read() {
    const result = this.traces.slice();
    this.clear();
    return result;
  }
  clear() {
    this.traces.length = 0;
  }
}
