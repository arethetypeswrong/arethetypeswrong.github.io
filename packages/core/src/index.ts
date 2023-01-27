import ts from 'typescript';
import type { EntrypointResult, FS, Host, ResolutionKind, Result, TraceCollector } from './types.js';
import { fetchTarballHost } from './fetchTarballHost.js';

export type * from './types.js';

export async function checkPackage(packageName: string, packageVersion?: string, host: Host = fetchTarballHost): Promise<Result> {
  const packageFS = await host.createPackageFS(packageName, packageVersion);
  const containsTypes = packageFS.listFiles().some(ts.hasTSFileExtension);
  if (!containsTypes) {
    return { containsTypes };
  }
  const entrypoints = checkEntrypoints(packageName, packageFS);
  return { containsTypes, entrypoints };
}

function checkEntrypoints(packageName: string, fs: FS): Record<string, Record<ResolutionKind, EntrypointResult>> {
  const packageJson = JSON.parse(fs.readFile(`/node_modules/${packageName}/package.json`));
  const entrypoints = packageJson.exports ? Object.keys(packageJson.exports) : ['.'];
  const result: Record<string, Record<ResolutionKind, EntrypointResult>> = {};
  for (const entrypoint of entrypoints) {
    result[entrypoint] = {
      'node10': checkEntrypointTyped(packageName, fs, 'node10', entrypoint),
      'node16-cjs': checkEntrypointTyped(packageName, fs, 'node16-cjs', entrypoint),
      'node16-esm': checkEntrypointTyped(packageName, fs, 'node16-esm', entrypoint),
      'bundler': checkEntrypointTyped(packageName, fs, 'bundler', entrypoint),
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

function checkEntrypointTyped(packageName: string, fs: FS, resolutionKind: ResolutionKind, entrypoint: string): EntrypointResult {
  const moduleSpecifier = packageName + entrypoint.substring(1); // remove leading . before slash
  const fileName = resolutionKind === 'node16-esm' ? '/index.mts' : '/index.ts';
  const moduleResolution =
    // @ts-expect-error
    resolutionKind === 'node10' ? ts.ModuleResolutionKind.Node10 :
    resolutionKind === 'node16-cjs' || resolutionKind === 'node16-esm' ? ts.ModuleResolutionKind.Node16 :
    // @ts-expect-error
    ts.ModuleResolutionKind.Bundler;
  const resolutionMode = resolutionKind === 'node16-esm' ? ts.ModuleKind.ESNext : ts.ModuleKind.CommonJS;
  const traceCollector = createTraceCollector();
  const resolutionHost = createModuleResolutionHost(fs, traceCollector.trace);
  
  const resolution = tryResolve();
  const implementationResolution = (!resolution || ts.isDeclarationFileName(resolution.fileName)) ? tryResolve(/*noDtsResolution*/ true) : undefined;

  return {
    name: entrypoint,
    isTyped: ts.hasTSFileExtension(resolution?.fileName || ''),
    resolution: resolution?.fileName,
    trace: traceCollector.read(),
    implementationResolution: implementationResolution?.fileName,
    isESMMismatch:
      resolution?.kind === ts.ModuleKind.ESNext && implementationResolution?.kind === ts.ModuleKind.CommonJS ||
      resolution?.kind === ts.ModuleKind.CommonJS && implementationResolution?.kind === ts.ModuleKind.ESNext,
  };

  function tryResolve(noDtsResolution?: boolean): { kind: ts.ModuleKind | undefined, fileName: string } | undefined {
    let kind: ts.ModuleKind | undefined;
    const resolution = ts.resolveModuleName(
      moduleSpecifier,
      fileName,
      {
        moduleResolution,
        traceResolution: !noDtsResolution,
        noDtsResolution,
      },
      resolutionHost,
      undefined,
      undefined,
      resolutionMode);
    if ((resolutionKind === 'node16-cjs' || resolutionKind === 'node16-esm') && resolution.resolvedModule) {
      if (resolution.resolvedModule.extension === ts.Extension.Mjs || resolution.resolvedModule.extension === ts.Extension.Mts) {
        kind = ts.ModuleKind.ESNext;
      }
      else if (resolution.resolvedModule.extension === ts.Extension.Cjs || resolution.resolvedModule.extension === ts.Extension.Cts) {
        kind = ts.ModuleKind.CommonJS;
      }
      else {
        const packageScope = ts.getPackageScopeForPath(
          resolution.resolvedModule.resolvedFileName,
          ts.getTemporaryModuleResolutionState(undefined, resolutionHost, { moduleResolution }));
        if (packageScope?.contents?.packageJsonContent.type === 'module') {
          kind = ts.ModuleKind.ESNext;
        }
        else {
          kind = ts.ModuleKind.CommonJS;
        }
      }
    }
    return resolution.resolvedModule ? { kind, fileName: resolution.resolvedModule.resolvedFileName } : undefined;
  }
}