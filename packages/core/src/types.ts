import type ts from "typescript";

export type ResolutionKind = "node10" | "node16-cjs" | "node16-esm" | "bundler";
export type ResolutionOption = "node10" | "node16" | "bundler";
export interface EntrypointInfo {
  subpath: string;
  resolutions: Record<ResolutionKind, EntrypointResolutionAnalysis>;
  hasTypes: boolean;
  isWildcard: boolean;
}

export interface IncludedTypes {
  kind: "included";
}
export interface TypesPackage {
  kind: "@types";
  packageName: string;
  packageVersion: string;
  definitelyTypedUrl?: string;
}
export type AnalysisTypes = IncludedTypes | TypesPackage;

export type BuildTool =
  | "@arethetypeswrong/cli"
  | "typescript"
  | "rollup"
  | "@rollup/plugin-typescript"
  | "@rollup/plugin-typescript2"
  | "webpack"
  | "esbuild"
  | "parcel-bundler"
  | "@preconstruct/cli"
  | "vite"
  | "snowpack"
  | "microbundle"
  | "@microsoft/api-extractor";

export interface Analysis {
  packageName: string;
  packageVersion: string;
  buildTools: Partial<Record<BuildTool, string>>;
  types: AnalysisTypes;
  entrypoints: Record<string, EntrypointInfo>;
  problems: Problem[];
}

export interface UntypedResult {
  packageName: string;
  packageVersion: string;
  types: false;
}

export type CheckResult = Analysis | UntypedResult;

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

export interface InternalResolutionErrorProblem {
  kind: "InternalResolutionError";
  resolutionOption: ResolutionOption;
  fileName: string;
  pos: number;
  end: number;
  moduleSpecifier: string;
  resolutionMode: ts.ResolutionMode;
  trace: string[];
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

export type ResolutionBasedFileProblem = InternalResolutionErrorProblem | UnexpectedModuleSyntaxProblem;
export type FileProblem = CJSOnlyExportsDefaultProblem;
export type Problem = EntrypointResolutionProblem | ResolutionBasedFileProblem | FileProblem;
export type ProblemKind = Problem["kind"];
export type FileProblemKind = FileProblem["kind"];
export type ResolutionBasedFileProblemKind = ResolutionBasedFileProblem["kind"];

export type Failable<T> = { status: "error"; error: string; data?: never } | { status: "success"; data: T };

export interface ParsedPackageSpec {
  name: string;
  versionKind: "none" | "exact" | "range" | "tag";
  version: string;
}
