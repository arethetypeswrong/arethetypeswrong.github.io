import "./patchGlobal";

import {
  checkPackage,
  checkTgz,
  getProblems,
  summarizeProblems,
  type Analysis,
  type Problem,
  type ProblemSummary,
} from "are-the-types-wrong-core";

export interface CheckPackageEventData {
  kind: "check-package";
  packageName: string;
  version: string | undefined;
}

export interface CheckFileEventData {
  kind: "check-file";
  file: Uint8Array;
}

export interface ResultMessage {
  kind: "result";
  data: {
    analysis: Analysis;
    problemSummaries?: ProblemSummary[];
    problems?: Problem[];
  };
}

onmessage = async (event: MessageEvent<CheckPackageEventData | CheckFileEventData>) => {
  const analysis =
    event.data.kind === "check-file"
      ? await checkTgz(event.data.file)
      : await checkPackage(event.data.packageName, event.data.version);
  const problems = analysis.containsTypes ? getProblems(analysis) : undefined;
  const problemSummaries = problems && analysis.containsTypes ? summarizeProblems(problems, analysis) : undefined;
  postMessage({
    kind: "result",
    data: {
      analysis,
      problemSummaries,
      problems,
    },
  } satisfies ResultMessage);
};
