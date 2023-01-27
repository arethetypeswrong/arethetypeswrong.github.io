// TODO: auto-imports didn't make this type-only
import type ts from 'typescript';

export interface Host {
  createPackageFS: (packageName: string, packageVersion?: string) => Promise<FS>;
}

export interface FS {
  readFile: (path: string) => string;
  fileExists: (path: string) => boolean;
  directoryExists: (path: string) => boolean;
  listFiles: () => string[];
}

export interface TraceCollector {
  trace: (message: string) => void;
  read: () => string[];
}

export type ResolutionKind = 'node10' | 'node16-cjs' | 'node16-esm' | 'bundler';

export type EntrypointResolutions = Record<string, Record<ResolutionKind, EntrypointResolutionAnalysis>>;

export interface TypedAnalysis {
  packageName: string;
  containsTypes: true;
  entrypointResolutions: EntrypointResolutions;
}

export interface UntypedAnalysis {
  containsTypes: false;
}

export type Analysis = TypedAnalysis | UntypedAnalysis;

export interface EntrypointResolutionAnalysis {
  name: string;
  resolution?: Resolution;
  implementationResolution?: Resolution;
  trace: string[];
}

export interface Resolution {
  fileName: string;
  isTypeScript: boolean;
  moduleKind: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS | undefined;
}
