import type { ProblemKind } from "are-the-types-wrong-core";

export const problemEmoji: Record<ProblemKind, string> = {
  Wildcard: "โ",
  NoResolution: "๐",
  UntypedResolution: "โ",
  FalseCJS: "๐ญ",
  FalseESM: "๐บ",
  CJSResolvesToESM: "โ ๏ธ",
  FallbackCondition: "๐",
  CJSOnlyExportsDefault: "๐คจ",
  FalseExportDefault: "โ๏ธ",
};
