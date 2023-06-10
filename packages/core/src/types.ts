import type ts from "typescript";

export interface Host {
  createPackageFS: (packageName: string, packageVersion?: string) => Promise<FS>;
  createPackageFSFromTarball: (tgz: Uint8Array) => Promise<FS>;
}

export interface FS {
  readFile: (path: string) => string;
  fileExists: (path: string) => boolean;
  directoryExists: (path: string) => boolean;
  listFiles: () => string[];
}

export type ResolutionKind = "node10" | "node16-cjs" | "node16-esm" | "bundler";
export type ResolutionOption = "node10" | "node16" | "bundler";
export interface EntrypointInfo {
  subpath: string;
  resolutions: Record<ResolutionKind, EntrypointResolutionAnalysis>;
  hasTypes: boolean;
  isWildcard: boolean;
}

export interface TypedAnalysis {
  packageName: string;
  packageVersion: string;
  containsTypes: true;
  entrypoints: Record<string, EntrypointInfo>;
  problems: Problem[];
}

export interface UntypedAnalysis {
  packageName: string;
  packageVersion: string;
  containsTypes: false;
}

export type Analysis = TypedAnalysis | UntypedAnalysis;

export interface EntrypointResolutionAnalysis {
  name: string;
  resolutionKind: ResolutionKind;
  isWildcard?: boolean;
  resolution?: Resolution;
  implementationResolution?: Resolution;
  files?: string[];
}

export type ModuleKindReason = "extension" | "type" | "no:type";
export interface ModuleKind {
  detectedKind: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS;
  detectedReason: ModuleKindReason;
  reasonFileName: string;
}

export interface Resolution {
  fileName: string;
  isTypeScript: boolean;
  isJson: boolean;
  moduleKind: ModuleKind | undefined;
  trace: string[];
}

export interface InternalResolutionErrorDetails {
  pos: number;
  end: number;
  moduleSpecifier: string;
  resolutionMode: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS | undefined;
  trace: string[];
}

export type EntrypointResolutionProblemKind =
  | "NoResolution"
  | "UntypedResolution"
  | "FalseESM"
  | "FalseCJS"
  | "CJSResolvesToESM"
  | "Wildcard"
  | "FallbackCondition"
  | "FalseExportDefault";

export interface EntrypointResolutionProblem {
  kind: EntrypointResolutionProblemKind;
  entrypoint: string;
  resolutionKind: ResolutionKind;
}

export interface InternalResolutionProblem {
  kind: "InternalResolutionError";
  resolutionOption: ResolutionOption;
  fileName: string;
  error: InternalResolutionErrorDetails;
}

export interface UnexpectedModuleSyntaxProblem {
  kind: "UnexpectedModuleSyntax";
  resolutionOption: ResolutionOption;
  syntax: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS;
  moduleKind: ModuleKind;
  fileName: string;
  range?: ts.TextRange;
}

export interface CJSOnlyExportsDefaultProblem {
  kind: "CJSOnlyExportsDefault";
  fileName: string;
  range: ts.TextRange;
}

export type ResolutionBasedFileProblem = InternalResolutionProblem | UnexpectedModuleSyntaxProblem;
export type FileProblem = CJSOnlyExportsDefaultProblem;
export type Problem = EntrypointResolutionProblem | ResolutionBasedFileProblem | FileProblem;
export type ProblemKind = Problem["kind"];
export type FileProblemKind = FileProblem["kind"];
export type ResolutionBasedFileProblemKind = ResolutionBasedFileProblem["kind"];

export type Failable<T> = { status: "error"; error: string } | { status: "success"; data: T };

export interface ParsedPackageSpec {
  packageName: string;
  version: string | undefined;
}
