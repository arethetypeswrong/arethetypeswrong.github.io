import ts from "typescript";
import { defineCheck } from "../defineCheck.js";
import { getEsmModuleNamespace } from "../esm/esmNamespace.js";

export default defineCheck({
  name: "NamedExports",
  dependencies: ({ entrypoints, subpath, resolutionKind }) => {
    const entrypoint = entrypoints[subpath].resolutions[resolutionKind];
    const typesFileName = entrypoint.resolution?.fileName;
    const implementationFileName = entrypoint.implementationResolution?.fileName;
    return [implementationFileName, typesFileName, resolutionKind];
  },
  execute: ([implementationFileName, typesFileName, resolutionKind], context) => {
    if (!implementationFileName || !typesFileName || resolutionKind !== "node16-esm") {
      return;
    }

    // Get declared exported names from TypeScript
    const host = context.hosts.findHostForFiles([typesFileName])!;
    const typesSourceFile = host.getSourceFile(typesFileName)!;
    const expectedNames = (() => {
      if (typesSourceFile.scriptKind === ts.ScriptKind.JSON) {
        // TypeScript reports top-level JSON keys as exports which is WRONG WRONG WRONG. A JSON file
        // never export anything other than `default`.
        return ["default"];
      } else {
        // nb: This is incomplete and reports type-only exports. This should be fixed to only return
        // expected runtime exports.
        const typeChecker = host.createAuxiliaryProgram([typesFileName]).getTypeChecker();
        const typesExports = typeChecker.getExportsAndPropertiesOfModule(typesSourceFile.symbol);
        return Array.from(
          new Set(
            typesExports
              .flatMap((node) => [...(node.declarations?.values() ?? [])])
              .filter((node) => !ts.isTypeAlias(node) && !ts.isTypeDeclaration(node) && !ts.isNamespaceBody(node))
              .map((declaration) => declaration.symbol.escapedName)
              .map(String),
          ),
        );
      }
    })();

    // Get actual exported names as seen by nodejs
    const exports = (() => {
      try {
        return getEsmModuleNamespace(context.pkg, implementationFileName);
      } catch {
        // nb: If this fails then the result is indeterminate. This could happen in many cases, but
        // a common one would be for packages which re-export from another another package.
      }
    })();
    if (exports) {
      const missing = expectedNames.filter((name) => !exports.includes(name));
      if (missing.length > 0) {
        const lengthWithoutDefault = (names: readonly string[]) => names.length - (names.includes("default") ? 1 : 0);
        return {
          kind: "NamedExports",
          implementationFileName,
          typesFileName,
          isMissingAllNamed: lengthWithoutDefault(missing) === lengthWithoutDefault(expectedNames),
          missing,
        };
      }
    }
  },
});
