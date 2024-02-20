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
    if (typesHaveSyntacticDefault && !getImplHasDefault() && implIsAnalyzable()) {
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

    if (!getImplHasDefault() || !implIsAnalyzable()) {
      // The implementation not having a default doesn't necessarily mean the
      // following checks are irrelevant, but this rule is designed primarily
      // to catch cases where type definition authors correctly notice that
      // their implementation has a `module.exports.default`, but don't realize
      // that the same object is exposed as `module.exports`. We bail early
      // here primarily because these checks are expensive.
      return;
    }

    if (
      !typesSourceFile.symbol.exports.has(ts.InternalSymbolName.ExportEquals) &&
      implementationSourceFile.symbol.exports.has(ts.InternalSymbolName.ExportEquals) &&
      ((getImplExportEqualsIsExportDefault() &&
        getTypesChecker().typeHasCallOrConstructSignatures(getTypesTypeOfDefault())) ||
        getImplChecker().typeHasCallOrConstructSignatures(getImplTypeOfModuleExports()))
    ) {
      return {
        kind: "MissingExportEquals",
        typesFileName,
        implementationFileName,
      };
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
      typeIsObjecty(getTypesTypeOfDefault(), getTypesChecker()) &&
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

    var implProbableExports: unknown,
      implChecker: unknown,
      implHasDefault: unknown,
      implTypeOfModuleExports: unknown,
      implExportEqualsIsExportDefault: unknown,
      typesChecker: unknown,
      typesTypeOfDefault: unknown;
    function getImplProbableExports(): Export[] {
      return ((implProbableExports as Export[]) ??= getProbableExports(implementationSourceFile));
    }
    function getImplChecker(): ts.TypeChecker {
      return ((implChecker as ts.TypeChecker) ??= host
        .createAuxiliaryProgram([implementationFileName!])
        .getTypeChecker());
    }
    function getImplHasDefault(): boolean {
      return ((implHasDefault as boolean) ??=
        implementationSourceFile?.symbol?.exports?.has(ts.InternalSymbolName.Default) ||
        getImplProbableExports()?.some((s) => s.name === "default") ||
        (!!implementationSourceFile.symbol?.exports?.size &&
          getImplChecker()
            .getExportsAndPropertiesOfModule(implementationSourceFile.symbol)
            .some((s) => s.name === "default")));
    }
    function getTypesChecker(): ts.TypeChecker {
      return ((typesChecker as ts.TypeChecker) ??= host.createAuxiliaryProgram([typesFileName!]).getTypeChecker());
    }
    function getTypesTypeOfDefault(): ts.Type {
      const symbol = getTypesChecker()
        .getExportsAndPropertiesOfModule(typesSourceFile.symbol)
        .find((s) => s.escapedName === "default");
      return ((typesTypeOfDefault as ts.Type) ??= symbol
        ? getTypesChecker().getTypeOfSymbol(symbol)
        : getTypesChecker().getAnyType());
    }
    function getImplTypeOfModuleExports(): ts.Type {
      if (implTypeOfModuleExports) {
        return implTypeOfModuleExports as ts.Type;
      }
      const type = getImplChecker().getTypeOfSymbol(
        getImplChecker().resolveExternalModuleSymbol(implementationSourceFile.symbol),
      );
      if (type.flags & ts.TypeFlags.Any && getImplExportEqualsIsExportDefault()) {
        return (implTypeOfModuleExports = getImplChecker().getTypeOfSymbol(
          implementationSourceFile.symbol.exports!.get(ts.InternalSymbolName.Default)!,
        ));
      }
      return (implTypeOfModuleExports = type);
    }
    function getImplExportEqualsIsExportDefault(): boolean {
      // TypeScript has a circularity error on `module.exports = exports.default`, so
      // detect that pattern syntactically.
      if (implExportEqualsIsExportDefault !== undefined) {
        return implExportEqualsIsExportDefault as boolean;
      }
      const exportEquals = implementationSourceFile.symbol.exports!.get(ts.InternalSymbolName.ExportEquals);
      if (!exportEquals) {
        return (implExportEqualsIsExportDefault = false);
      }
      const exportDefault = implementationSourceFile.symbol.exports!.get(ts.InternalSymbolName.Default);
      if (!exportDefault) {
        return (implExportEqualsIsExportDefault = false);
      }
      for (const assignment of [
        exportEquals.valueDeclaration,
        ts.findAncestor(exportDefault.declarations?.[0], ts.isBinaryExpression),
      ]) {
        let seenModuleExports = false,
          seenExportsDefault = false;
        if (
          assignment &&
          ts.isBinaryExpression(assignment) &&
          assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken
        ) {
          const res = !!forEachAssignmentTarget(assignment, (target) => {
            if (!seenExportsDefault && isExportsDefault(target)) {
              seenExportsDefault = true;
            } else if (!seenModuleExports && isModuleExports(target)) {
              seenModuleExports = true;
            }

            return seenExportsDefault && seenModuleExports;
          });
          if (res) {
            return (implExportEqualsIsExportDefault = true);
          }
        }
      }
      return (implExportEqualsIsExportDefault = false);
    }
    function implIsAnalyzable(): boolean {
      if (implementationSourceFile.symbol.exports!.get(ts.InternalSymbolName.ExportEquals)?.declarations?.length! > 1) {
        // Multiple assignments in different function bodies is probably a bundle we can't analyze.
        // Multiple assignments in the same function body might just be an environment-conditional
        // module.exports inside an IIFE.
        let commonContainer;
        for (const decl of implementationSourceFile.symbol.exports!.get(ts.InternalSymbolName.ExportEquals)!
          .declarations!) {
          const container = ts.findAncestor(decl, (node) => ts.isFunctionBlock(node) || ts.isSourceFile(node));
          if (commonContainer === undefined) {
            commonContainer = container;
          } else if (commonContainer !== container) {
            return false;
          }
        }
      }
      return !!(implementationSourceFile.symbol.exports!.size || getImplProbableExports()?.length);
    }
  },
});

function typeIsObjecty(type: ts.Type, checker: ts.TypeChecker) {
  return (
    type.flags & ts.TypeFlags.Object &&
    !(type.flags & ts.TypeFlags.Primitive) &&
    !checker.typeHasCallOrConstructSignatures(type)
  );
}

function isModuleExports(target: ts.Expression) {
  return (
    (ts.isAccessExpression(target) &&
      ts.isIdentifier(target.expression) &&
      target.expression.text === "module" &&
      getNameOfAccessExpression(target) === "exports") ||
    (ts.isIdentifier(target) && target.text === "exports")
  );
}

function isExportsDefault(target: ts.Expression) {
  return (
    (ts.isAccessExpression(target) &&
      ts.isIdentifier(target.expression) &&
      target.expression.text === "exports" &&
      getNameOfAccessExpression(target) === "default") ||
    (ts.isAccessExpression(target) &&
      ts.isAccessExpression(target.expression) &&
      ts.isIdentifier(target.expression.expression) &&
      target.expression.expression.text === "module" &&
      getNameOfAccessExpression(target.expression) === "exports" &&
      getNameOfAccessExpression(target) === "default")
  );
}

function isNotDefaultOrEsModule(name: string) {
  return name !== "default" && name !== "__esModule";
}

function forEachAssignmentTarget<ReturnT>(
  assignment: ts.BinaryExpression,
  cb: (target: ts.Expression) => ReturnT | undefined,
): ReturnT | undefined {
  // For `module.exports = exports = exports.default`, fires `cb` once for
  // `exports.default`, once for `exports`, and once for `module.exports`.
  const target = ts.skipParentheses(assignment.right);
  if (ts.isBinaryExpression(target) && target.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    const res = forEachAssignmentTarget(target, cb);
    if (res) {
      return res;
    }
  } else {
    const res = cb(target);
    if (res) {
      return res;
    }
  }
  return cb(ts.skipParentheses(assignment.left));
}

function getNameOfAccessExpression(accessExpression: ts.AccessExpression): string | undefined {
  const node = ts.getNameOfAccessExpression(accessExpression);
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) {
    return node.text;
  }
}
