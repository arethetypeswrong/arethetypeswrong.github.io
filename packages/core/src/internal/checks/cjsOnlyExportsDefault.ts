import ts from "typescript";
import { defineCheck } from "../defineCheck.js";

export default defineCheck({
  name: "CJSOnlyExportsDefault",
  dependencies: ({ entrypoints, subpath, resolutionKind }) => {
    const entrypoint = entrypoints[subpath].resolutions[resolutionKind];
    const implementationFileName = entrypoint.implementationResolution?.fileName;
    return [implementationFileName];
  },
  execute: ([implementationFileName], context) => {
    if (!implementationFileName) {
      return;
    }
    const host = context.hosts.findHostForFiles([implementationFileName]) ?? context.hosts.bundler;
    const sourceFile = host.getSourceFile(implementationFileName)!;
    if (
      !sourceFile.externalModuleIndicator &&
      sourceFile.commonJsModuleIndicator &&
      sourceFile.symbol?.exports?.has(ts.InternalSymbolName.Default) &&
      sourceFile.symbol.exports.has(ts.escapeLeadingUnderscores("__esModule")) &&
      !sourceFile.symbol.exports.has(ts.InternalSymbolName.ExportEquals)
    ) {
      const decl = sourceFile.symbol.exports.get(ts.InternalSymbolName.Default)!.declarations![0];
      return {
        kind: "CJSOnlyExportsDefault",
        fileName: implementationFileName,
        pos: decl.getStart(sourceFile),
        end: decl.end,
      };
    }
  },
});
