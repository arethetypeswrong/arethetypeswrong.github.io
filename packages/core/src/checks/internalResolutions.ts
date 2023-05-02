import ts from "typescript";
import type { MultiCompilerHost } from "../multiCompilerHost.js";
import type { FS, InternalResolutionProblem } from "../types.js";

export function getInternalResolutionProblems(
  packageName: string,
  packageFS: FS,
  host: MultiCompilerHost
): InternalResolutionProblem[] {
  const result: InternalResolutionProblem[] = [];
  const fileNames = packageFS.listFiles();
  for (const resolutionOption of ["node10", "node16", "bundler"] as const) {
    for (const fileName of fileNames) {
      if (!ts.hasTSFileExtension(fileName)) {
        continue;
      }
      const sourceFile = host.getSourceFile(fileName, resolutionOption)!;
      const imports = sourceFile.statements.filter(ts.or(ts.isImportDeclaration, ts.isImportEqualsDeclaration));
      for (const importDeclaration of imports) {
        const moduleSpecifier = ts.tryGetModuleSpecifierFromDeclaration(importDeclaration);
        if (!moduleSpecifier) {
          continue;
        }

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
        const { resolution, trace } = host.resolveModuleName(reference, fileName, resolutionOption, resolutionMode);

        if (!resolution.resolvedModule) {
          result.push({
            kind: "InternalResolutionError",
            resolutionOption,
            error: {
              fileName,
              moduleSpecifier: reference,
              pos: moduleSpecifier.pos,
              end: moduleSpecifier.end,
              resolutionMode,
              trace,
            },
          });
        }
      }
    }
  }
  return result;
}
