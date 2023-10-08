import cjsOnlyExportsDefault from "./cjsOnlyExportsDefault.js";
import entrypointResolutions from "./entrypointResolutions.js";
import exportDefaultDisagreement from "./exportDefaultDisagreement.js";
import internalResolutionError from "./internalResolutionError.js";
import moduleKindDisagreement from "./moduleKindDisagreement.js";
import unexpectedModuleSyntax from "./unexpectedModuleSyntax.js";

export default [
  entrypointResolutions,
  moduleKindDisagreement,
  exportDefaultDisagreement,
  cjsOnlyExportsDefault,
  unexpectedModuleSyntax,
  internalResolutionError,
];
