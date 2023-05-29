import * as core from "@arethetypeswrong/core";

export function untyped(analysis: core.UntypedAnalysis) {
  console.log("This package does not contain types.\n");
  console.log("Details: ", analysis);
}
