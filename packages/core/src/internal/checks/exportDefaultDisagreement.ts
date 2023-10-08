import ts from "typescript";
import { defineCheck } from "../defineCheck.js";

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
    if (!typesFileName || !implementationFileName) {
      return;
    }
    const host = context.hosts.findHostForFiles([typesFileName])!;
    const typesSourceFile = host.getSourceFile(typesFileName)!;
    ts.bindSourceFile(typesSourceFile, bindOptions);
    const typesExports = typesSourceFile.symbol.exports;
    if (!typesExports) {
      return;
    }
    const implementationSourceFile = host.getSourceFile(implementationFileName)!;
    ts.bindSourceFile(implementationSourceFile, bindOptions);
    const implExports = implementationSourceFile.symbol.exports;
    if (!implExports) {
      return;
    }
    if (
      typesExports.has(ts.InternalSymbolName.Default) &&
      !typesExports.has(ts.InternalSymbolName.ExportEquals) &&
      implExports.has(ts.InternalSymbolName.ExportEquals)
    ) {
      if (!implExports.has(ts.InternalSymbolName.Default)) {
        const checker = host.createProgram([implementationFileName], bindOptions).getTypeChecker();
        if (
          !checker.getExportsAndPropertiesOfModule(implementationSourceFile.symbol).some((s) => s.name === "default")
        ) {
          return {
            kind: "FalseExportDefault",
            typesFileName,
            implementationFileName,
          };
        }
      }
      // types have a default, JS has a default and a module.exports =
      return {
        kind: "MissingExportEquals",
        typesFileName,
        implementationFileName,
      };
    }
  },
});
