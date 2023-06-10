import type { ProblemKind } from "./types.js";

export interface ProblemKindInfo {
  title: string;
  emoji: string;
  shortDescription: string;
  description: string;
}

export const problemKindInfo: Record<ProblemKind, ProblemKindInfo> = {
  Wildcard: {
    emoji: "❓",
    title: "Wildcards",
    shortDescription: "Unable to check",
    description: "Wildcard subpaths cannot yet be analyzed by this tool.",
  },
  NoResolution: {
    emoji: "💀",
    title: "Resolution failed",
    shortDescription: "Failed to resolve",
    description: "Import failed to resolve to type declarations or JavaScript files.",
  },
  UntypedResolution: {
    emoji: "❌",
    title: "Could not find types",
    shortDescription: "No types",
    description: "Import resolved to JavaScript files, but no type declarations were found.",
  },
  FalseCJS: {
    emoji: "🎭",
    title: "Types are CJS, but implementation is ESM",
    shortDescription: "Masquerading as CJS",
    description: "Import resolved to a CommonJS type declaration file, but an ESM JavaScript file.",
  },
  FalseESM: {
    emoji: "👺",
    title: "Types are ESM, but implementation is CJS",
    shortDescription: "Masquerading as ESM",
    description: "Import resolved to an ESM type declaration file, but a CommonJS JavaScript file.",
  },
  CJSResolvesToESM: {
    emoji: "⚠️",
    title: "Entrypoint is ESM-only",
    shortDescription: "ESM (dynamic import only)",
    description:
      "A `require` call resolved to an ESM JavaScript file, which is an error in Node and some bundlers. CommonJS consumers will need to use a dynamic import.",
  },
  FallbackCondition: {
    emoji: "🐛",
    title: "Resloved through fallback condition",
    shortDescription: "Used fallback condition",
    description:
      "Import resolved to types through a conditional package.json export, but only after failing to resolve through an earlier condition. This behavior is a [TypeScript bug](https://github.com/microsoft/TypeScript/issues/50762). It may misrepresent the runtime behavior of this import and should not be relied upon.",
  },
  CJSOnlyExportsDefault: {
    emoji: "🤨",
    title: "CJS module uses default export",
    shortDescription: "CJS default export",
    description:
      "CommonJS module simulates a default export with `exports.default` and `exports.__esModule`, but does not also set `module.exports` for compatibility with Node. Node, and [some bundlers under certain conditions](https://andrewbranch.github.io/interop-test/#synthesizing-default-exports-for-cjs-modules), do not respect the `__esModule` marker, so accessing the intended default export will require a `.default` property access on the default import.",
  },
  FalseExportDefault: {
    emoji: "❗️",
    title: "Types incorrectly use default export",
    shortDescription: "Incorrect default export",
    description:
      "The resolved types use `export default` where the JavaScript file appears to use `module.exports =`. This will cause TypeScript under the `node16` module mode to think an extra `.default` property access is required, but that will likely fail at runtime. These types should use `export =` instead of `export default`.",
  },
  UnexpectedModuleSyntax: {
    emoji: "🚭",
    title: "Syntax is incompatible with detected module kind",
    shortDescription: "Unexpected module syntax",
    description:
      "Syntax detected in the module is incompatible with the module kind according to the package.json or file extension. This is an error in Node and may cause problems in some bundlers.",
  },
  InternalResolutionError: {
    emoji: "🥴",
    title: "Internal resolution error",
    shortDescription: "Internal resolution error",
    description:
      "Import found in a type declaration file failed to resolve. Either this indicates that runtime resolution errors will occur, or (more likely) the types misrepresent the contents of the JavaScript files.",
  },
};
