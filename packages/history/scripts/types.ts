import type { CheckResult } from "@arethetypeswrong/core";

export interface CheckResultBlob {
  kind: "analysis";
  workerId: number;
  index: number;
  data: CheckResult;
}
export interface ErrorBlob {
  kind: "error";
  workerId: number;
  message: string;
  index: number;
  packageName: string;
  packageVersion: string;
}
export type Blob = CheckResultBlob | ErrorBlob;
