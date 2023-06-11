import ts from "typescript";
import type { MultiCompilerHost } from "../multiCompilerHost.js";
import type { EntrypointInfo, FileProblem } from "../types.js";
import { isDefined } from "../utils.js";

export function getFileProblems(
  entrypointResolutions: Record<string, EntrypointInfo>,
  host: MultiCompilerHost
): FileProblem[] {
  const problems: FileProblem[] = [];
  const visibleFiles = new Set(
    Object.values(entrypointResolutions).flatMap((entrypointResolution) => {
      return Object.values(entrypointResolution.resolutions).flatMap((resolution) => {
        return [resolution.resolution?.fileName, resolution.implementationResolution?.fileName].filter(isDefined);
      });
    })
  );

  for (const fileName of visibleFiles) {
    if (ts.hasJSFileExtension(fileName)) {
      const sourceFile = host.getSourceFile(fileName, "node16")!;
      if (
        !sourceFile.externalModuleIndicator &&
        sourceFile.commonJsModuleIndicator &&
        sourceFile.symbol?.exports?.has(ts.InternalSymbolName.Default) &&
        sourceFile.symbol.exports.has(ts.escapeLeadingUnderscores("__esModule")) &&
        !sourceFile.symbol.exports.has(ts.InternalSymbolName.ExportEquals)
      ) {
        const decl = sourceFile.symbol.exports.get(ts.InternalSymbolName.Default)!.declarations![0];
        problems.push({
          kind: "CJSOnlyExportsDefault",
          fileName,
          range: {
            pos: decl.getStart(sourceFile),
            end: decl.end,
          },
        });
      }
    }
  }

  return problems;
}
