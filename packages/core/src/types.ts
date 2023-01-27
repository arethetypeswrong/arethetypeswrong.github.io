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

export interface TypedResult {
  containsTypes: true;
  entrypoints: Record<string, Record<ResolutionKind, EntrypointResult>>;
}

export interface UntypedResult {
  containsTypes: false;
}

export type Result = TypedResult | UntypedResult;

export interface EntrypointResult {
  name: string;
  isTyped: boolean;
  resolution?: string;
  implementationResolution?: string;
  isESMMismatch: boolean;
  trace: string[];
}
