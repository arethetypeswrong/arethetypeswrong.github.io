import * as core from "@arethetypeswrong/core";

export function untyped(analysis: core.UntypedResult) {
  return "This package does not contain types.\nDetails: " + JSON.stringify(analysis, null, 2);
}
