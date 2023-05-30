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

export interface InternalResolutionError {
  fileName: string;
  pos: number;
  end: number;
  moduleSpecifier: string;
  resolutionMode: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS | undefined;
  trace: string[];
}

export type ProblemKind =
  | "NoResolution"
  | "UntypedResolution"
  | "FalseESM"
  | "FalseCJS"
  | "CJSResolvesToESM"
  | "Wildcard"
  | "FallbackCondition"
  | "FalseExportDefault"
  | "InternalResolutionError"
  | "UnexpectedModuleSyntax"
  | "CJSOnlyExportsDefault";

export interface BaseProblem {
  kind: ProblemKind;
}

export interface EntrypointResolutionProblem {
  kind: ProblemKind;
  entrypoint: string;
  resolutionKind: ResolutionKind;
}

export interface InternalResolutionProblem extends BaseProblem {
  kind: "InternalResolutionError";
  resolutionOption: ResolutionOption;
  error: InternalResolutionError;
}

export interface UnexpectedModuleSyntaxProblem extends BaseProblem {
  kind: "UnexpectedModuleSyntax";
  expectedModuleKind: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS;
  moduleKind: ModuleKind;
  fileName: string;
  range?: ts.TextRange;
}

export interface CJSOnlyExportsDefaultProblem extends BaseProblem {
  kind: "CJSOnlyExportsDefault";
  fileName: string;
  range: ts.TextRange;
}

export type Problem = EntrypointResolutionProblem;

export interface SummarizedProblems {
  problems: EntrypointResolutionProblemSummary<EntrypointResolutionProblem>[];
}

export interface ProblemSummary<T extends Problem> {
  kind: T["kind"];
  title: string;
  description: string;
  problems: T[];
}

export interface EntrypointResolutionProblemSummary<T extends EntrypointResolutionProblem> extends ProblemSummary<T> {
  resolutionKindsAffected: ResolutionKind[];
  resolutionKindsAffectedInAllEntrypoints: ResolutionKind[];
  entrypointsAffected: string[];
}
