import "./patchGlobal";
import {
  checkPackage,
  getSummarizedProblems,
  type Analysis,
  type ProblemSummary,
  type Problem,
  getProblems,
  type ResolutionProblem,
} from "are-the-types-wrong-core";

export interface CheckPackageEventData {
  kind: "check-package";
  packageName: string;
}

export interface ResultMessage {
  kind: "result";
  data: {
    analysis: Analysis;
    problemSummaries: ProblemSummary[];
    resolutionProblems: ResolutionProblem[];
  };
}

onmessage = async (event: MessageEvent<CheckPackageEventData>) => {
  const analysis = await checkPackage(event.data.packageName);
  const problemSummaries = getSummarizedProblems(analysis);
  const resolutionProblems = analysis.containsTypes ? getProblems(analysis) : [];
  postMessage({
    kind: "result",
    data: {
      analysis,
      problemSummaries,
      resolutionProblems,
    },
  } satisfies ResultMessage);
};
