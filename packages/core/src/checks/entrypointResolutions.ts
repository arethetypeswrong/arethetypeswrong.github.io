import ts from "typescript";
import type { EntrypointResolutionProblem, EntrypointResolutions } from "../types.js";
import type { MultiCompilerHost } from "../multiCompilerHost.js";
import { resolvedThroughFallback } from "../utils.js";

export function getEntrypointResolutionProblems(
  entrypointResolutions: EntrypointResolutions,
  host: MultiCompilerHost
): EntrypointResolutionProblem[] {
  const problems: EntrypointResolutionProblem[] = [];
  for (const subpath in entrypointResolutions) {
    const entrypoint = entrypointResolutions[subpath];
    for (const kind in entrypoint) {
      const resolutionKind = kind as keyof typeof entrypoint;
      const result = entrypoint[resolutionKind];
      if (result.isWildcard) {
        problems.push({
          kind: "Wildcard",
          entrypoint: subpath,
          resolutionKind,
        });
        continue;
      }
      if (!result.resolution) {
        problems.push({
          kind: "NoResolution",
          entrypoint: subpath,
          resolutionKind,
        });
      } else if (!result.resolution.isTypeScript && !result.resolution.isJson) {
        problems.push({
          kind: "UntypedResolution",
          entrypoint: subpath,
          resolutionKind,
        });
      }

      const { resolution, implementationResolution } = result;
      if (
        resolution?.moduleKind?.detectedKind === ts.ModuleKind.ESNext &&
        implementationResolution?.moduleKind?.detectedKind === ts.ModuleKind.CommonJS
      ) {
        problems.push({
          kind: "FalseESM",
          entrypoint: subpath,
          resolutionKind,
        });
      } else if (
        resolution?.moduleKind?.detectedKind === ts.ModuleKind.CommonJS &&
        implementationResolution?.moduleKind?.detectedKind === ts.ModuleKind.ESNext
      ) {
        problems.push({
          kind: "FalseCJS",
          entrypoint: subpath,
          resolutionKind,
        });
      }

      if (resolutionKind === "node16-cjs" && resolution?.moduleKind?.detectedKind === ts.ModuleKind.ESNext) {
        problems.push({
          kind: "CJSResolvesToESM",
          entrypoint: subpath,
          resolutionKind,
        });
      }

      if (resolution && resolvedThroughFallback(resolution.trace)) {
        problems.push({
          kind: "FallbackCondition",
          entrypoint: subpath,
          resolutionKind,
        });
      }

      const typesExports = resolution && host.getSourceFile(resolution.fileName)?.symbol?.exports;
      const jsExports =
        implementationResolution && host.getSourceFile(implementationResolution.fileName)?.symbol?.exports;

      if (resolutionKind === "node16-esm" && resolution && implementationResolution && typesExports && jsExports) {
        if (typesExports.has(ts.InternalSymbolName.Default) && jsExports.has(ts.InternalSymbolName.ExportEquals)) {
          // Also need to check for `default` property on `jsModule["export="]`?
          problems.push({
            kind: "FalseExportDefault",
            entrypoint: subpath,
            resolutionKind,
          });
        }
      }
    }
  }
  return problems;
}
