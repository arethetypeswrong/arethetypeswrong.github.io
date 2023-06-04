import * as core from "@arethetypeswrong/core";
import type { ProblemKind } from "@arethetypeswrong/core";

export const problemFlags: Record<ProblemKind, string> = {
  Wildcard: "wildcard",
  NoResolution: "no-resolution",
  UntypedResolution: "untyped-resolution",
  FalseCJS: "false-cjs",
  FalseESM: "false-esm",
  CJSResolvesToESM: "cjs-resolves-to-esm",
  FallbackCondition: "fallback-condition",
  CJSOnlyExportsDefault: "cjs-only-exports-default",
  FalseExportDefault: "false-export-default",
  UnexpectedESMSyntax: "unexpected-esm-syntax",
  UnexpectedCJSSyntax: "unexpected-cjs-syntax",
};

export const problemEmoji: Record<ProblemKind, string> = {
  Wildcard: "❓",
  NoResolution: "💀",
  UntypedResolution: "🚫",
  FalseCJS: "🎭",
  FalseESM: "👺",
  CJSResolvesToESM: "⚠️",
  FallbackCondition: "🐛",
  CJSOnlyExportsDefault: "🤨",
  FalseExportDefault: "❗️",
  UnexpectedESMSyntax: "🚭",
  UnexpectedCJSSyntax: "🚱",
};

export const withEmoji: Record<ProblemKind, string> = {
  Wildcard: `${problemEmoji.Wildcard} Unable to check`,
  NoResolution: `${problemEmoji.NoResolution} Failed to resolve`,
  UntypedResolution: `${problemEmoji.UntypedResolution} No types`,
  FalseCJS: `${problemEmoji.FalseCJS} Masquerading as CJS`,
  FalseESM: `${problemEmoji.FalseESM} Masquerading as ESM`,
  CJSResolvesToESM: `${problemEmoji.CJSResolvesToESM} ESM (dynamic import only)`,
  FallbackCondition: `${problemEmoji.FallbackCondition} Used fallback condition`,
  CJSOnlyExportsDefault: `${problemEmoji.CJSOnlyExportsDefault} CJS default export`,
  FalseExportDefault: `${problemEmoji.FalseExportDefault} Incorrect default export`,
  UnexpectedESMSyntax: `${problemEmoji.UnexpectedESMSyntax} Unexpected ESM syntax`,
  UnexpectedCJSSyntax: `${problemEmoji.UnexpectedCJSSyntax} Unexpected CJS syntax`,
};

export const noEmoji: Record<ProblemKind, string> = {
  Wildcard: `Unable to check`,
  NoResolution: `Failed to resolve`,
  UntypedResolution: `No types`,
  FalseCJS: `Masquerading as CJS`,
  FalseESM: `Masquerading as ESM`,
  CJSResolvesToESM: `ESM (dynamic import only)`,
  FallbackCondition: `Used fallback condition`,
  CJSOnlyExportsDefault: `CJS default export`,
  FalseExportDefault: `Incorrect default export`,
  UnexpectedESMSyntax: `Unexpected ESM syntax`,
  UnexpectedCJSSyntax: `Unexpected CJS syntax`,
};

export const problemShortDescriptions = {
  emoji: withEmoji,
  noEmoji: noEmoji,
};

export const resolutionKinds: Record<core.ResolutionKind, string> = {
  node10: "node10",
  "node16-cjs": "node16 (from CJS)",
  "node16-esm": "node16 (from ESM)",
  bundler: "bundler",
};

export const moduleKinds = {
  1: "(CJS)",
  99: "(ESM)",
  "": "",
};
