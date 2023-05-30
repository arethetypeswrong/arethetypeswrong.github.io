import type { EntrypointInfo, EntrypointResolutionAnalysis, ResolutionKind, ResolutionOption } from "./types.js";

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

export function visitResolutions(
  entrypoints: Record<string, EntrypointInfo>,
  visitor: (analysis: EntrypointResolutionAnalysis, info: EntrypointInfo) => unknown
) {
  for (const entrypoint of Object.values(entrypoints)) {
    for (const resolution of Object.values(entrypoint.resolutions)) {
      if (visitor(resolution, entrypoint)) {
        return;
      }
    }
  }
}
