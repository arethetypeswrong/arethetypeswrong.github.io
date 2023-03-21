import type { ProblemKind } from "are-the-types-wrong-core";

export const problemEmoji: Record<ProblemKind, string> = {
  Wildcard: "❓",
  NoResolution: "💀",
  UntypedResolution: "❌",
  FalseCJS: "🎭",
  FalseESM: "👺",
  CJSResolvesToESM: "⚠️",
  FallbackCondition: "🐛",
  CJSOnlyExportsDefault: "🤨",
  FalseExportDefault: "❗️",
  UnexpectedESMSyntax: "🚭",
  UnexpectedCJSSyntax: "🚱",
};
