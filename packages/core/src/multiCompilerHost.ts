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
}

export function createCompilerHosts(fs: Package): CompilerHosts {
  return {
    node10: new CompilerHostWrapper(fs, ts.ModuleResolutionKind.Node10, ts.ModuleKind.CommonJS),
    node16: new CompilerHostWrapper(fs, ts.ModuleResolutionKind.Node16, ts.ModuleKind.Node16),
    bundler: new CompilerHostWrapper(fs, ts.ModuleResolutionKind.Bundler, ts.ModuleKind.ESNext),
  };
}

const getCanonicalFileName = ts.createGetCanonicalFileName(false);
const toPath = (fileName: string) => ts.toPath(fileName, "/", getCanonicalFileName);

export class CompilerHostWrapper {
  private compilerHost: ts.CompilerHost;
  private compilerOptions: ts.CompilerOptions;
  private normalModuleResolutionCache: ts.ModuleResolutionCache;
  private noDtsResolutionModuleResolutionCache: ts.ModuleResolutionCache;

  private traceCache: Record</*FromFileName*/ string, Record</*Key*/ string, string[]>> = {};
  private traceCollector: TraceCollector = new TraceCollector();

  private languageVersion = ts.ScriptTarget.Latest;

  constructor(fs: Package, moduleResolution: ts.ModuleResolutionKind, moduleKind: ts.ModuleKind) {
    this.compilerOptions = {
      moduleResolution,
      module: moduleKind,
      target: ts.ScriptTarget.Latest,
      resolveJsonModule: true,
      traceResolution: true,
    };
    this.normalModuleResolutionCache = ts.createModuleResolutionCache("/", getCanonicalFileName, this.compilerOptions);
    this.noDtsResolutionModuleResolutionCache = ts.createModuleResolutionCache(
      "/",
      getCanonicalFileName,
      this.compilerOptions
    );
    this.compilerHost = this.createCompilerHost(fs);
  }

  getSourceFile(fileName: string): ts.SourceFile | undefined {
    return this.compilerHost.getSourceFile(fileName, this.languageVersion);
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
    noDtsResolution?: boolean
  ): ResolveModuleNameResult {
    this.traceCollector.clear();
    const resolution = ts.resolveModuleName(
      moduleName,
      containingFile,
      noDtsResolution ? { ...this.compilerOptions, noDtsResolution } : this.compilerOptions,
      this.compilerHost,
      noDtsResolution ? this.noDtsResolutionModuleResolutionCache : this.normalModuleResolutionCache,
      /*redirectedReference*/ undefined,
      resolutionMode
    );
    const trace = this.traceCollector.read();
    const moduleKey = `${resolutionMode ?? 1}:${moduleName}`;
    if (!this.traceCache[containingFile]?.[moduleKey]) {
      (this.traceCache[containingFile] ??= {})[moduleKey] = trace;
    }
    return {
      resolution,
      trace,
    };
  }

  getTrace(
    fromFileName: string,
    moduleSpecifier: string,
    resolutionMode: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS | undefined
  ): string[] | undefined {
    return this.traceCache[fromFileName]?.[`${resolutionMode ?? 1}:${moduleSpecifier}`];
  }

  createProgram(rootNames: string[]): ts.Program {
    return ts.createProgram({
      rootNames,
      options: this.compilerOptions,
      host: this.compilerHost,
    });
  }

  private createCompilerHost(fs: Package): ts.CompilerHost {
    const sourceFileCache = new Map<ts.Path, ts.SourceFile>();
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
        const content = fileName.startsWith("/node_modules/typescript/lib") ? "" : fs.readFile(fileName);
        const sourceFile = ts.createSourceFile(
          fileName,
          content,
          {
            languageVersion: this.languageVersion,
            impliedNodeFormat: this.getImpliedNodeFormatForFile(fileName),
          },
          /*setParentNodes*/ true
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
        containingSourceFile
      ) => {
        return moduleLiterals.map(
          (literal) =>
            this.resolveModuleName(
              literal.text,
              containingFile,
              ts.getModeForUsageLocation(containingSourceFile, literal),
              options.noDtsResolution
            ).resolution
        );
      },
    };
  }

  private getImpliedNodeFormatForFile(fileName: string): ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS | undefined {
    return ts.getImpliedNodeFormatForFile(
      toPath(fileName),
      this.normalModuleResolutionCache.getPackageJsonInfoCache(),
      this.compilerHost,
      this.compilerOptions
    );
  }

  private getPackageScopeForPath(fileName: string): ts.PackageJsonInfo | undefined {
    return ts.getPackageScopeForPath(
      fileName,
      ts.getTemporaryModuleResolutionState(
        // TODO: consider always using the node16 cache because package.json should be a hit
        this.normalModuleResolutionCache.getPackageJsonInfoCache(),
        this.compilerHost,
        this.compilerOptions
      )
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
