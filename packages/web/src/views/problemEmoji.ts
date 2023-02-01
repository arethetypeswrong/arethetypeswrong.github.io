import type { ProblemKind } from "are-the-types-wrong-core";

export const problemEmoji: Record<ProblemKind, string> = {
  NoTypes: "",
  Wildcard: "❓",
  NoResolution: "💀",
  UntypedResolution: "❌",
  FalseCJS: "🎭",
  FalseESM: "👺",
  CJSResolvesToESM: "😵‍💫",
};
