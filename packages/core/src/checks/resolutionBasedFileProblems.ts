import ts from "typescript";
import type { MultiCompilerHost } from "../multiCompilerHost.js";
import type { EntrypointInfo, ResolutionBasedFileProblem } from "../types.js";
import { allResolutionOptions, getResolutionKinds } from "../utils.js";

export function getResolutionBasedFileProblems(
  packageName: string,
  entrypointResolutions: Record<string, EntrypointInfo>,
  host: MultiCompilerHost
): ResolutionBasedFileProblem[] {
  const result: ResolutionBasedFileProblem[] = [];
  for (const resolutionOption of allResolutionOptions) {
    const visibleFiles = Object.values(entrypointResolutions).flatMap((entrypoint) => {
      const files = new Set<string>();
      getResolutionKinds(resolutionOption).forEach((resolutionKind) => {
        entrypoint.resolutions[resolutionKind].files?.forEach((file) => files.add(file));
        if (entrypoint.resolutions[resolutionKind].implementationResolution) {
          files.add(entrypoint.resolutions[resolutionKind].implementationResolution!.fileName);
        }
      });
      return Array.from(files);
    });

    for (const fileName of visibleFiles) {
      const sourceFile = host.getSourceFile(fileName, resolutionOption)!;

      if (sourceFile.imports) {
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
              fileName,
              error: {
                moduleSpecifier: reference,
                pos: moduleSpecifier.pos,
                end: moduleSpecifier.end,
                resolutionMode,
                trace: host.getTrace(resolutionOption, fileName, moduleSpecifier.text, resolutionMode)!,
              },
            });
          }
        }
      }

      // TODO: for each visible declaration file in the program, we could
      // try to do a ts->js extension substitution and assume that's a
      // visible JS file if it exists.
      //
      // Actually, we probably want to check the relative directory relationship
      // between an entrypoint resolution and implementationResolution as the basis
      // for looking for a JS file.
      if (resolutionOption === "node16") {
        if (ts.hasJSFileExtension(fileName)) {
          const expectedModuleKind = host.getModuleKindForFile(fileName, resolutionOption);
          const syntaxImpliedModuleKind = sourceFile.externalModuleIndicator
            ? ts.ModuleKind.ESNext
            : sourceFile.commonJsModuleIndicator
            ? ts.ModuleKind.CommonJS
            : undefined;
          if (
            expectedModuleKind !== undefined &&
            syntaxImpliedModuleKind !== undefined &&
            expectedModuleKind.detectedKind !== syntaxImpliedModuleKind
          ) {
            const syntax = sourceFile.externalModuleIndicator ?? sourceFile.commonJsModuleIndicator;
            result.push({
              kind: "UnexpectedModuleSyntax",
              resolutionOption,
              syntax: syntaxImpliedModuleKind,
              fileName,
              range:
                typeof syntax === "object"
                  ? {
                      pos: syntax.getStart(sourceFile),
                      end: syntax.end,
                    }
                  : undefined,
              moduleKind: expectedModuleKind,
            });
          }
        }
      }
    }
  }

  return result;
}
