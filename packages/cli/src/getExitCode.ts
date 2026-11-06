import type { CheckResult } from "@arethetypeswrong/core";
import { problemAffectsResolutionKind } from "@arethetypeswrong/core/problems";
import { allResolutionKinds } from "@arethetypeswrong/core/utils";
import { problemFlags } from "./problemUtils.js";
import type { RenderOptions } from "./render/index.js";

export function getExitCode(analysis: CheckResult, opts?: RenderOptions): number {
  if (!analysis.types) {
    return 0;
  }
  const ignoreRules = opts?.ignoreRules ?? [];
  const ignoreResolutions = opts?.ignoreResolutions ?? [];
  const requiredResolutions = allResolutionKinds.filter((kind) => !ignoreResolutions.includes(kind));
  return analysis.problems.some((problem) => {
    const notRuleIgnored = !ignoreRules.includes(problemFlags[problem.kind]);
    const affectsRequiredResolution = requiredResolutions.some((kind) =>
      problemAffectsResolutionKind(problem, kind, analysis),
    );
    return notRuleIgnored && affectsRequiredResolution;
  })
    ? 1
    : 0;
}
