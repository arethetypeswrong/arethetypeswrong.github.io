import ts from "typescript";
import type { Package } from "../../createPackage.js";
import { init, parse } from "cjs-module-lexer";
import { defineCheck } from "../defineCheck.js";

await init();

function* crawlExports(pkg: Package, fileName: string, seen = new Set<string>()): Iterable<string> {
  if (seen.has(fileName)) {
    return;
  }
  seen.add(fileName);
  const result = parse(pkg.readFile(fileName));
  yield* result.exports;
  for (const relativeName of result.reexports) {
    if (relativeName.startsWith(".")) {
      const resolvedName = new URL(relativeName, `cjs://${fileName}`);
      yield* crawlExports(pkg, String(resolvedName).slice(6), seen);
    }
  }
}

export default defineCheck({
  name: "CJSNamedExports",
  dependencies: ({ entrypoints, subpath, resolutionKind }) => {
    const entrypoint = entrypoints[subpath].resolutions[resolutionKind];
    const moduleType = entrypoint.implementationResolution?.isCommonJS ? ("cjs" as const) : undefined;
    const typesFileName = entrypoint.resolution?.fileName;
    const implementationFileName = entrypoint.implementationResolution?.fileName;
    return [implementationFileName, typesFileName, resolutionKind, moduleType];
  },
  execute: ([implementationFileName, typesFileName, resolutionKind, moduleType], context) => {
    if (!implementationFileName || !typesFileName || resolutionKind !== "node16-esm" || moduleType !== "cjs") {
      return;
    }
    const exports = [...crawlExports(context.pkg, implementationFileName)];
    const host = context.hosts.findHostForFiles([typesFileName])!;
    const typesSourceFile = host.getSourceFile(typesFileName)!;
    const typeChecker = host.createAuxiliaryProgram([typesFileName]).getTypeChecker();
    const typesExports = typeChecker.getExportsOfModule(typesSourceFile.symbol);
    const expectedNames = typesExports
      .flatMap((node) => [...(node.declarations?.values() ?? [])])
      .filter((node) => !ts.isTypeDeclaration(node))
      .map((declaration) => declaration.symbol.escapedName);
    const missingNames = expectedNames.filter((name) => !exports.includes(String(name)));
    if (missingNames.length > 0) {
      console.log("missing", missingNames);
      return {
        kind: "CJSNamedExports",
        implementationFileName,
        typesFileName,
      };
    }
  },
});
