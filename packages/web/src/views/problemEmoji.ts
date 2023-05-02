import type { ProblemKind } from "@arethetypeswrong/core";

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
  UnexpectedModuleSyntax: "🚭",
  InternalResolutionError: "🥴",
};
