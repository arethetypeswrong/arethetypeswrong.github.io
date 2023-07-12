import type { CheckResult } from "@arethetypeswrong/core";

export interface CheckResultBlob {
  kind: "analysis";
  workerId: number;
  data: CheckResult;
}
export interface ErrorBlob {
  kind: "error";
  workerId: number;
  message: string;
  packageName: string;
  packageVersion: string;
  tarballUrl: string;
  prevMessage?: string;
}
export type Blob = CheckResultBlob | ErrorBlob;

export interface FullJsonLine {
  packageSpec: string;
  coreVersion: string;
  rank: number;
  analysis: CheckResult;
}

export interface DatesJson {
  npmHighImpactVersion: string;
  dates: {
    [date: string]: {
      packageName: string;
      packageVersion: string;
      tarballUrl: string;
    }[];
  };
}
