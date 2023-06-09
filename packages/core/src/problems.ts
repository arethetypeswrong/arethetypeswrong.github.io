import type {
  EntrypointResolutionProblem,
  ProblemKind,
  ResolutionKind,
  TypedAnalysis,
  Problem,
  SummarizedProblems,
  EntrypointResolutionProblemSummary,
  EntrypointResolutionProblemKind,
  FileProblemKind,
  FileProblemSummary,
  ResolutionBasedFileProblem,
  ResolutionBasedFileProblemKind,
  ResolutionBasedFileProblemSummary,
} from "./types.js";
import { isEntrypointResolutionProblem, isFileProblem, isResolutionBasedFileProblem } from "./utils.js";

export { resolvedThroughFallback } from "./utils.js";

const problemTitles: Record<ProblemKind, string> = {
  Wildcard: "Wildcards",
  NoResolution: "Resolution failed",
  UntypedResolution: "Could not find types",
  FalseESM: "Types are ESM, but implementation is CJS",
  FalseCJS: "Types are CJS, but implementation is ESM",
  CJSResolvesToESM: "Entrypoint is ESM-only",
  UnexpectedModuleSyntax: "Syntax is incompatible with detected module kind",
  FallbackCondition: "Resloved through fallback condition",
  CJSOnlyExportsDefault: "CJS module uses default export",
  FalseExportDefault: "Types incorrectly use default export",
  InternalResolutionError: "Internal resolution error",
};

const problemDescriptions: Record<ProblemKind, string> = {
  Wildcard: "Wildcards cannot yet be analyzed by this tool.",
  NoResolution: "Import failed to resolve.",
  UntypedResolution: "Import resolved to JavaScript files, but no types.",
  FalseESM:
    "Import resolved to a type declaration file that represents an ES module, but it looks like a runtime would resolve to a CommonJS module.",
  FalseCJS:
    "Import resolved to a type declaration file that represents a CommonJS module, but it looks like a runtime would resolve to an ES module.",
  CJSResolvesToESM:
    "CommonJS `require` resolved to an ES module, which is an error in Node. CommonJS modules in Node will only be able to access the entrypoint with a dynamic import.",
  UnexpectedModuleSyntax:
    "Syntax detected in the module is incompatible with the module kind according to the package.json or file extension. This is an error in Node and may cause problems in some bundlers.",
  FallbackCondition:
    "Import resolved through a conditional package.json export, but only after failing to resolve through an earlier condition. This behavior is a [TypeScript bug](https://github.com/microsoft/TypeScript/issues/50762) and should not be relied upon.",
  CJSOnlyExportsDefault:
    "Some CommonJS modules at package entrypoints contain a simulated `export default` with an `__esModule` marker, but no top-level `module.exports`. Node does not respect the `__esModule` marker, so accessing the intended default export will require using the `.default` property on the default import when importing from an ES module in Node (and in some bundlers under some circumstances).",
  FalseExportDefault:
    "The types resolved at ${entrypoints} use `export default` where the implementation appears to use `module.exports =`. Node treats a default import of these constructs from an ES module differently, so these types will make TypeScript under the `node16` resolution mode think an extra `.default` property access is required, but that will likely fail at runtime in Node. These types should use `export =` instead of `export default`.",
  InternalResolutionError: "Import found in a type declaration file failed to resolve.",
};

export function groupByKind<K extends ProblemKind>(
  problems: (Problem & { kind: K })[]
): Partial<Record<K, (Problem & { kind: K })[]>> {
  const result: Partial<Record<K, (Problem & { kind: K })[]>> = {};
  for (const problem of problems) {
    (result[problem.kind] ??= []).push(problem);
  }
  return result;
}

export function summarizeProblems(analysis: TypedAnalysis): SummarizedProblems {
  const { problems } = analysis;
  const groupedEntrypointResolutionProblems = groupByKind(problems.filter(isEntrypointResolutionProblem));
  const groupedFileProblems = groupByKind(problems.filter(isFileProblem));
  const gropuedResolutionBasedFileProblems = groupByKind(problems.filter(isResolutionBasedFileProblem));
  const entrypointResolutionProblemSummaries: EntrypointResolutionProblemSummary[] = [];
  const fileProblemSummaries: FileProblemSummary[] = [];
  const resolutionBasedFileProblemSummaries: ResolutionBasedFileProblemSummary<ResolutionBasedFileProblem>[] = [];
  for (const kind in groupedEntrypointResolutionProblems) {
    const problems = groupedEntrypointResolutionProblems[kind as EntrypointResolutionProblemKind]!;
    const allTypedEntrypoints = new Set(
      Object.keys(analysis.entrypoints).filter((e) => analysis.entrypoints[e].hasTypes)
    );
    const groupedByEntrypoint = groupByEntrypoint(problems);
    const groupedByResolutionKind = groupByResolutionKind(problems);
    const fullRows = Object.values(groupedByResolutionKind)
      .map((problems) => {
        const unaffectedEntrypoints = new Set(allTypedEntrypoints);
        for (const problem of problems) {
          unaffectedEntrypoints.delete(problem.entrypoint);
        }
        return unaffectedEntrypoints.size === 0 ? problems : undefined;
      })
      .filter((g): g is EntrypointResolutionProblem[] => !!g);
    const summary: EntrypointResolutionProblemSummary = {
      kind: problems[0].kind,
      title: problemTitles[problems[0].kind],
      description: problemDescriptions[problems[0].kind],
      problems,
      entrypointsAffected: Object.keys(groupedByEntrypoint),
      resolutionKindsAffected: Object.keys(groupedByResolutionKind) as ResolutionKind[],
      resolutionKindsAffectedInAllEntrypoints: fullRows.map((r) => r[0].resolutionKind),
    };
    entrypointResolutionProblemSummaries.push(summary);
  }
  for (const kind in groupedFileProblems) {
    const problems = groupedFileProblems[kind as FileProblemKind]!;
    const summary: FileProblemSummary = {
      kind: problems[0].kind,
      title: problemTitles[problems[0].kind],
      description: problemDescriptions[problems[0].kind],
      problems,
    };
    fileProblemSummaries.push(summary);
  }
  for (const kind in gropuedResolutionBasedFileProblems) {
    const problems = gropuedResolutionBasedFileProblems[kind as ResolutionBasedFileProblemKind]!;
    const summary: ResolutionBasedFileProblemSummary<ResolutionBasedFileProblem> = {
      kind: problems[0].kind,
      title: problemTitles[problems[0].kind],
      description: problemDescriptions[problems[0].kind],
      problems,
      resolutionOptionsAffected: problems.map((p) => p.resolutionOption),
    };
    resolutionBasedFileProblemSummaries.push(summary);
  }
  return {
    entrypointResolutionProblems: entrypointResolutionProblemSummaries,
    fileProblems: fileProblemSummaries,
    resolutionBasedFileProblems: resolutionBasedFileProblemSummaries,
  };
}

function groupByResolutionKind(problems: EntrypointResolutionProblem[]) {
  return problems.reduce((result: Partial<Record<ResolutionKind, EntrypointResolutionProblem[]>>, problem) => {
    (result[problem.resolutionKind] ??= []).push(problem);
    return result;
  }, {});
}

function groupByEntrypoint(problems: EntrypointResolutionProblem[]) {
  return problems.reduce((result: Record<string, EntrypointResolutionProblem[]>, problem) => {
    (result[problem.entrypoint] ??= []).push(problem);
    return result;
  }, {});
}
