import type { Package } from "../createPackage.js";
import type { CompilerHosts } from "../multiCompilerHost.js";
import type { Analysis, Problem, ResolutionKind, ResolutionOption } from "../types.js";

export interface CheckDependenciesContext<EnumerateFiles extends boolean = false> extends CheckExecutionContext {
  subpath: string;
  resolutionKind: ResolutionKind;
  resolutionOption: ResolutionOption;
  fileName: EnumerateFiles extends true ? string : undefined;
}

export interface CheckExecutionContext {
  pkg: Package;
  hosts: CompilerHosts;
  entrypoints: Analysis["entrypoints"];
  programInfo: Analysis["programInfo"];
}

// Interface types are not assignable to Serializable due to missing index signature.
// This breaks them down into an equivalently structured object type, which have
// implicit index signatures for assignability purposes.
type Structure<T> = T extends (...args: never) => any ? T : { [K in keyof T]: Structure<T[K]> };

export type EnsureSerializable<T> = [T] extends [Serializable]
  ? T
  : [T] extends [object]
  ? Structure<T> extends Serializable
    ? T
    : never
  : never;

export type Serializable =
  | string
  | number
  | null
  | undefined
  | boolean
  | { [key: string]: Serializable }
  | Serializable[];

export interface AnyCheck {
  name: string;
  enumerateFiles?: boolean;
  dependencies: (context: CheckDependenciesContext<boolean>) => EnsureSerializable<any[]>;
  execute: (dependencies: any, context: CheckExecutionContext) => Problem[] | Problem | undefined;
}

export function defineCheck<const Dependencies extends any[], EnumerateFiles extends boolean>(options: {
  name: string;
  enumerateFiles?: EnumerateFiles;
  dependencies: (context: CheckDependenciesContext<EnumerateFiles>) => EnsureSerializable<Dependencies>;
  execute: (dependencies: Dependencies, context: CheckExecutionContext) => Problem[] | Problem | undefined;
}) {
  return options;
}
