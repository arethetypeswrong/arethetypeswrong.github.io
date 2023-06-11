import ts from "typescript";
import type { FS, ModuleKind, ResolutionOption } from "./types.js";

export interface ResolveModuleNameResult {
  resolution: ts.ResolvedModuleWithFailedLookupLocations;
  trace: string[];
}

export interface MultiCompilerHost {
  getSourceFile(fileName: string, moduleResolution?: ResolutionOption): ts.SourceFile | undefined;
  getImpliedNodeFormatForFile(
    fileName: string,
    moduleResolution: ResolutionOption
  ): ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS | undefined;
  getPackageScopeForPath(fileName: string): ts.PackageJsonInfo | undefined;
  getModuleKindForFile(fileName: string, moduleResolution: "node16"): ModuleKind;
  getModuleKindForFile(fileName: string, moduleResolution: ResolutionOption): ModuleKind | undefined;
  resolveModuleName(
    moduleName: string,
    containingFile: string,
    moduleResolution: ResolutionOption,
    resolutionMode?: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS,
    noDtsResolution?: boolean
  ): ResolveModuleNameResult;
  getTrace(
    moduleResolution: ResolutionOption,
    fromFileName: string,
    moduleName: string,
    resolutionMode: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS | undefined
  ): string[] | undefined;
  createProgram(moduleResolution: ResolutionOption, rootNames: string[]): ts.Program;
}

export function createMultiCompilerHost(fs: FS): MultiCompilerHost {
  const useCaseSensitiveFileNames = () => false;
  const getCanonicalFileName = ts.createGetCanonicalFileName(false);
  const getCurrentDirectory = () => "/";
  const getNewLine = () => "\n";
  const getDefaultLibFileName = () => "/node_modules/typescript/lib/lib.d.ts";
  const toPath = (fileName: string) => ts.toPath(fileName, "/", getCanonicalFileName);
  const writeFile = () => {
    throw new Error("Not implemented");
  };
  const languageVersion = ts.ScriptTarget.Latest;
  const traceCollector = createTraceCollector();
  const compilerOptions: Record<ResolutionOption, ts.CompilerOptions> = {
    node10: {
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.Latest,
      resolveJsonModule: true,
      traceResolution: true,
    },
    node16: {
      moduleResolution: ts.ModuleResolutionKind.Node16,
      module: ts.ModuleKind.Node16,
      target: ts.ScriptTarget.Latest,
      resolveJsonModule: true,
      traceResolution: true,
    },
    bundler: {
      // @ts-expect-error
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.Latest,
      resolveJsonModule: true,
      traceResolution: true,
    },
  };
  const moduleResolutionCaches: Record<
    ResolutionOption,
    [normal: ts.ModuleResolutionCache, noDtsResolution: ts.ModuleResolutionCache]
  > = {
    node10: [
      ts.createModuleResolutionCache("/", getCanonicalFileName, compilerOptions.node10),
      ts.createModuleResolutionCache("/", getCanonicalFileName, compilerOptions.node10),
    ],
    node16: [
      ts.createModuleResolutionCache("/", getCanonicalFileName, compilerOptions.node16),
      ts.createModuleResolutionCache("/", getCanonicalFileName, compilerOptions.node16),
    ],
    bundler: [
      ts.createModuleResolutionCache("/", getCanonicalFileName, compilerOptions.bundler),
      ts.createModuleResolutionCache("/", getCanonicalFileName, compilerOptions.bundler),
    ],
  };
  const compilerHosts: Record<ResolutionOption, ts.CompilerHost> = {
    node10: createCompilerHost("node10"),
    node16: createCompilerHost("node16"),
    bundler: createCompilerHost("bundler"),
  };
  const traceCache: Record<ResolutionOption, Record</*FromFileName*/ string, Record</*Key*/ string, string[]>>> = {
    node10: {},
    node16: {},
    bundler: {},
  };

  return {
    getSourceFile,
    getImpliedNodeFormatForFile,
    getPackageScopeForPath,
    getModuleKindForFile,
    resolveModuleName,
    createProgram,
    getTrace,
  };

  function getSourceFile(fileName: string, moduleResolution: ResolutionOption = "bundler"): ts.SourceFile | undefined {
    return compilerHosts[moduleResolution].getSourceFile(fileName, languageVersion);
  }

  function getImpliedNodeFormatForFile(
    fileName: string,
    moduleResolution: ResolutionOption
  ): ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS | undefined {
    return ts.getImpliedNodeFormatForFile(
      toPath(fileName),
      moduleResolutionCaches[moduleResolution][0].getPackageJsonInfoCache(),
      compilerHosts[moduleResolution],
      compilerOptions[moduleResolution]
    );
  }

  function getPackageScopeForPath(fileName: string): ts.PackageJsonInfo | undefined {
    // Which compiler options get used here is irrelevant.
    // Use the node16 cache because package.json it should be a hit.
    return ts.getPackageScopeForPath(
      fileName,
      ts.getTemporaryModuleResolutionState(
        moduleResolutionCaches.node16[0].getPackageJsonInfoCache(),
        compilerHosts.node16,
        compilerOptions.node16
      )
    );
  }

  function getModuleKindForFile(fileName: string, moduleResolution: "node16"): ModuleKind;
  function getModuleKindForFile(fileName: string, moduleResolution: ResolutionOption): ModuleKind | undefined;
  function getModuleKindForFile(fileName: string, moduleResolution: ResolutionOption): ModuleKind | undefined {
    const kind = getImpliedNodeFormatForFile(fileName, moduleResolution);
    if (kind) {
      const extension = ts.getAnyExtensionFromPath(fileName);
      const isExtension =
        extension === ts.Extension.Cjs ||
        extension === ts.Extension.Cts ||
        extension === ts.Extension.Dcts ||
        extension === ts.Extension.Mjs ||
        extension === ts.Extension.Mts ||
        extension === ts.Extension.Dmts;
      const reasonPackageJsonInfo = isExtension ? undefined : getPackageScopeForPath(fileName);
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

  function resolveModuleName(
    moduleName: string,
    containingFile: string,
    moduleResolution: ResolutionOption,
    resolutionMode?: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS,
    noDtsResolution?: boolean
  ): ResolveModuleNameResult {
    traceCollector.clear();
    const options = compilerOptions[moduleResolution];
    const resolution = ts.resolveModuleName(
      moduleName,
      containingFile,
      noDtsResolution ? { ...options, noDtsResolution } : options,
      compilerHosts[moduleResolution],
      moduleResolutionCaches[moduleResolution][+!!noDtsResolution],
      /*redirectedReference*/ undefined,
      resolutionMode
    );
    const trace = traceCollector.read();
    const moduleKey = `${resolutionMode ?? 1}:${moduleName}`;
    (traceCache[moduleResolution][containingFile] ??= {})[moduleKey] = trace;
    return {
      resolution,
      trace,
    };
  }

  function getTrace(moduleResolution: ResolutionOption, fromFileName: string, key: string): string[] | undefined {
    return traceCache[moduleResolution][fromFileName]?.[key];
  }

  function createProgram(moduleResolution: ResolutionOption, rootNames: string[]): ts.Program {
    return ts.createProgram({
      rootNames,
      options: compilerOptions[moduleResolution],
      host: compilerHosts[moduleResolution],
    });
  }

  function createCompilerHost(moduleResolution: ResolutionOption): ts.CompilerHost {
    const sourceFileCache = new Map<ts.Path, ts.SourceFile>();
    return {
      ...fs,
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
            languageVersion,
            impliedNodeFormat: getImpliedNodeFormatForFile(fileName, moduleResolution),
          },
          /*setParentNodes*/ true
        );
        sourceFileCache.set(path, sourceFile);
        return sourceFile;
      },
      getDefaultLibFileName,
      getCurrentDirectory,
      writeFile,
      getCanonicalFileName,
      useCaseSensitiveFileNames,
      getNewLine,
      trace: traceCollector.trace,
    };
  }

  function createTraceCollector() {
    const traces: string[] = [];
    return {
      trace: (message: string) => traces.push(message),
      read: () => {
        const result = traces.slice();
        clear();
        return result;
      },
      clear,
    };
    function clear() {
      traces.length = 0;
    }
  }
}
