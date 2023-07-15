import ts from "typescript";
import type { EntrypointInfo, EntrypointResolutionProblem } from "../types.js";
import type { CompilerHosts } from "../multiCompilerHost.js";
import { resolvedThroughFallback, visitResolutions } from "../utils.js";

export function getEntrypointResolutionProblems(
  entrypointResolutions: Record<string, EntrypointInfo>,
  hosts: CompilerHosts
): EntrypointResolutionProblem[] {
  const problems: EntrypointResolutionProblem[] = [];
  visitResolutions(entrypointResolutions, (result, entrypoint) => {
    const { subpath } = entrypoint;
    const { resolutionKind } = result;
    if (result.isWildcard) {
      problems.push({
        kind: "Wildcard",
        entrypoint: subpath,
        resolutionKind,
      });
      return;
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

    if (resolutionKind === "node16-esm" && resolution && implementationResolution) {
      const typesSourceFile = hosts.node16.getSourceFile(resolution.fileName);
      if (typesSourceFile) {
        ts.bindSourceFile(typesSourceFile, { target: ts.ScriptTarget.Latest, allowJs: true, checkJs: true });
      }
      const typesExports = typesSourceFile?.symbol?.exports;
      const jsSourceFile = typesExports && hosts.node16.getSourceFile(implementationResolution.fileName);
      if (jsSourceFile) {
        ts.bindSourceFile(jsSourceFile, { target: ts.ScriptTarget.Latest, allowJs: true, checkJs: true });
      }
      const jsExports = jsSourceFile?.symbol?.exports;
      if (typesExports && jsExports) {
        if (
          typesExports.has(ts.InternalSymbolName.Default) &&
          !typesExports.has(ts.InternalSymbolName.ExportEquals) &&
          jsExports.has(ts.InternalSymbolName.ExportEquals) &&
          !jsExports.has(ts.InternalSymbolName.Default)
        ) {
          // Also need to check for `default` property on `jsModule["export="]`?
          problems.push({
            kind: "FalseExportDefault",
            entrypoint: subpath,
            resolutionKind,
          });
        }
      }
    }
  });
  return problems;
}
