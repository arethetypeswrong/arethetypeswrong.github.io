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
    const typeChecker = host.createAuxiliaryProgram([typesFileName]).getTypeChecker();
    const typesExports = typeChecker.getExportsAndPropertiesOfModule(typesSourceFile.symbol);
    const expectedNames = Array.from(
      new Set(
        typesExports
          .flatMap((node) => [...(node.declarations?.values() ?? [])])
          .filter((node) => !ts.isTypeAlias(node) && !ts.isTypeDeclaration(node) && !ts.isNamespaceBody(node))
          .map((declaration) => declaration.symbol.escapedName),
      ),
    );

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
      const missing = expectedNames.filter((name) => !exports.includes(String(name))).map(String);
      if (missing.length > 0) {
        console.log("🚨", implementationFileName, missing);
        return {
          kind: "NamedExports",
          implementationFileName,
          typesFileName,
          missing,
        };
      }
    }
  },
});
