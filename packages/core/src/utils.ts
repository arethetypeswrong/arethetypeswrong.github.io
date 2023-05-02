import type {
  EntrypointResolutionProblem,
  EntrypointResolutionProblemKind,
  FileProblem,
  Problem,
  ProblemKind,
  ResolutionKind,
  ResolutionOption,
} from "./types.js";

export const allResolutionOptions: ResolutionOption[] = ["node10", "node16", "bundler"];
export const allResolutionKinds: ResolutionKind[] = ["node10", "node16-cjs", "node16-esm", "bundler"];

export function getResolutionOption(resolutionKind: ResolutionKind): ResolutionOption {
  switch (resolutionKind) {
    case "node10":
      return "node10";
    case "node16-cjs":
    case "node16-esm":
      return "node16";
    case "bundler":
      return "bundler";
  }
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

type AssertNever<T extends never> = T;

export function isEntrypointResolutionProblemKind(kind: ProblemKind): kind is EntrypointResolutionProblemKind {
  switch (kind) {
    case "NoResolution":
    case "UntypedResolution":
    case "FalseESM":
    case "FalseCJS":
    case "CJSResolvesToESM":
    case "Wildcard":
    case "FallbackCondition":
    case "FalseExportDefault":
      return true;
    default:
      return false as AssertNever<typeof kind & EntrypointResolutionProblemKind>;
  }
}

export function isEntrypointResolutionProblem(problem: Problem): problem is EntrypointResolutionProblem {
  return isEntrypointResolutionProblemKind(problem.kind);
}

export function isFileProblem(problem: Problem): problem is FileProblem {
  return !isEntrypointResolutionProblem(problem);
}

export function resolvedThroughFallback(traces: string[]) {
  let i = 0;
  while (i < traces.length) {
    i = traces.indexOf("Entering conditional exports.", i);
    if (i === -1) {
      return false;
    }
    if (conditionalExportsResolvedThroughFallback()) {
      return true;
    }
  }

  function conditionalExportsResolvedThroughFallback(): boolean {
    i++;
    let seenFailure = false;
    for (; i < traces.length; i++) {
      if (traces[i].startsWith("Failed to resolve under condition '")) {
        seenFailure = true;
      } else if (seenFailure && traces[i].startsWith("Resolved under condition '")) {
        return true;
      } else if (traces[i] === "Entering conditional exports.") {
        if (conditionalExportsResolvedThroughFallback()) {
          return true;
        }
      } else if (traces[i] === "Exiting conditional exports.") {
        return false;
      }
    }
    return false;
  }
}
