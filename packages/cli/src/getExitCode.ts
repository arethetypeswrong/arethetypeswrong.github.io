import type { CheckResult } from "@arethetypeswrong/core";
import { problemFlags } from "./problemUtils.ts";
import type { RenderOptions } from "./render/index.ts";

export function getExitCode(analysis: CheckResult, opts?: RenderOptions): number {
  if (!analysis.types) {
    return 0;
  }
  if (!opts?.ignoreRules) {
    return analysis.problems.length > 0 ? 1 : 0;
  }
  return analysis.problems.some((problem) => !opts.ignoreRules!.includes(problemFlags[problem.kind])) ? 1 : 0;
}
