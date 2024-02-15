import ts from "typescript";
import { defineCheck } from "../defineCheck.js";
import { getProbableExports, type Export } from "../getProbableExports.js";

const bindOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.Latest,
  allowJs: true,
  checkJs: true,
};

export default defineCheck({
  name: "ExportDefaultDisagreement",
  dependencies: ({ entrypoints, subpath, resolutionKind }) => {
    const entrypoint = entrypoints[subpath].resolutions[resolutionKind];
    const typesFileName = entrypoint.resolution?.fileName;
    const implementationFileName = entrypoint.implementationResolution?.fileName;
    return [typesFileName, implementationFileName];
  },
  execute: ([typesFileName, implementationFileName], context) => {
    if (!typesFileName || !implementationFileName || !ts.hasTSFileExtension(typesFileName)) {
      return;
    }
    const host = context.hosts.findHostForFiles([typesFileName])!;
    const typesSourceFile = host.getSourceFile(typesFileName)!;
    ts.bindSourceFile(typesSourceFile, bindOptions);
    if (!typesSourceFile.symbol?.exports) {
      return;
    }
    const implementationSourceFile = host.getSourceFile(implementationFileName)!;
    ts.bindSourceFile(implementationSourceFile, bindOptions);
    if (!implementationSourceFile.symbol?.exports) {
      return;
    }

    // FalseExportDefault: types have a default, JS doesn't.
    // For this check, we're going to require the types to have a top-level
    // default export, which means we might miss something like:
    //
    // declare namespace foo {
    //   const _default: string;
    //   export { _default as default };
    // }
    // export = foo;
    //
    // But that's not a mistake people really make. If we don't need to
    // recognize that pattern, we can avoid creating a program and checker
    // for this error.
    const typesHaveSyntacticDefault = typesSourceFile.symbol.exports.has(ts.InternalSymbolName.Default);
    if (typesHaveSyntacticDefault && !getImplHasDefault()) {
      return {
        kind: "FalseExportDefault",
        typesFileName,
        implementationFileName,
      };
    }

    // MissingExportEquals: types and JS have a default, but JS also has a
    // module.exports = not reflected in the types.
    // There are a few variations of this problem. The most straightforward
    // is when the types declare *only* a default export, and the JS declares
    // a module.exports and a module.exports.default in different declarations:
    //
    // module.exports = SomeClass;
    // module.exports.default = SomeClass;
    //
    // Then, there's the slight variation on this where the `default` property
    // is separately declared on `SomeClass`. This requires the type checker.
    // Finally, there's the case where the types declare a default export along
    // with other named exports. That *could* accurately represent a
    // `module.exports = { default, ... }` in JS, but only if the named exports
    // are values, not types. It also *couldn't* accurately represent a
    // `module.exports = SomeClass`, where the exported value is callable,
    // constructable, or a primitive.

    if (!getImplHasDefault()) {
      return;
    }

    const typesHaveNonDefaultValueExport = Array.from(typesSourceFile.symbol.exports.values()).some((s) => {
      if (s.escapedName === "default") {
        return false;
      }
      if (s.flags & ts.SymbolFlags.Value) {
        return true;
      }
      while (s.flags & ts.SymbolFlags.Alias) {
        s = getTypesChecker().getAliasedSymbol(s);
        if (s.flags & ts.SymbolFlags.Value) {
          return true;
        }
      }
    });

    if (
      !typesHaveNonDefaultValueExport &&
      (Array.from(implementationSourceFile.symbol.exports.keys()).some((name) =>
        isNotDefaultOrEsModule(ts.unescapeLeadingUnderscores(name)),
      ) ||
        getImplProbableExports().some(({ name }) => isNotDefaultOrEsModule(name))) &&
      (typesHaveSyntacticDefault ||
        getTypesChecker()
          .getExportsAndPropertiesOfModule(typesSourceFile.symbol)
          .some((s) => s.escapedName === "default"))
    ) {
      return {
        kind: "MissingExportEquals",
        typesFileName,
        implementationFileName,
      };
    }

    var implProbableExports: unknown, implHasDefault: unknown, typesChecker: unknown;
    function getImplProbableExports(): Export[] {
      return ((implProbableExports as Export[]) ??= getProbableExports(implementationSourceFile));
    }
    function getImplHasDefault(): boolean {
      return ((implHasDefault as boolean) ??=
        implementationSourceFile?.symbol?.exports?.has(ts.InternalSymbolName.Default) ||
        getImplProbableExports()?.some((s) => s.name === "default") ||
        host
          .createAuxiliaryProgram([implementationFileName!], bindOptions)
          .getTypeChecker()
          .getExportsAndPropertiesOfModule(implementationSourceFile.symbol)
          .some((s) => s.name === "default"));
    }
    function getTypesChecker(): ts.TypeChecker {
      return ((typesChecker as ts.TypeChecker) ??= host.createAuxiliaryProgram([typesFileName!]).getTypeChecker());
    }
  },
});

function isNotDefaultOrEsModule(name: string) {
  return name !== "default" && name !== "__esModule";
}
