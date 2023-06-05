import ts from "typescript";
import type { MultiCompilerHost } from "../multiCompilerHost.js";
import type { EntrypointInfo, InternalResolutionProblem } from "../types.js";
import { getResolutionOption, visitResolutions } from "../utils.js";

export function getInternalResolutionProblems(
  packageName: string,
  entrypointResolutions: Record<string, EntrypointInfo>,
  host: MultiCompilerHost
): InternalResolutionProblem[] {
  const result: InternalResolutionProblem[] = [];
  visitResolutions(entrypointResolutions, (analysis) => {
    if (!analysis.resolution?.isTypeScript) {
      return;
    }
    const fileName = analysis.resolution?.fileName;
    const resolutionOption = getResolutionOption(analysis.resolutionKind);
    const sourceFile = host.getSourceFile(fileName, resolutionOption)!;
    for (const moduleSpecifier of sourceFile.imports) {
      const reference = moduleSpecifier.text;
      if (
        reference !== packageName &&
        !reference.startsWith(`${packageName}/`) &&
        reference[0] !== "#" &&
        !ts.pathIsRelative(reference)
      ) {
        // Probably a reference to something we'd have to npm install.
        // These can definitely be errors, but I'm not installing a whole
        // graph for now.
        continue;
      }
      const resolutionMode = ts.getModeForUsageLocation(sourceFile, moduleSpecifier);
      const resolution = ts.getResolvedModule(sourceFile, moduleSpecifier.text, resolutionMode);

      if (!resolution) {
        result.push({
          kind: "InternalResolutionError",
          resolutionOption,
          error: {
            fileName,
            moduleSpecifier: reference,
            pos: moduleSpecifier.pos,
            end: moduleSpecifier.end,
            resolutionMode,
            trace: host.getTrace(resolutionOption, fileName, moduleSpecifier.text, resolutionMode)!,
          },
        });
      }
    }
  });

  return result;
}
