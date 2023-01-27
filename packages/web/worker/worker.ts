import { checkPackage, getSummarizedProblems, type Analysis, type ProblemSummary } from "are-the-types-wrong-core";

export interface CheckPackageEventData {
  kind: 'check-package';
  packageName: string;
}

export interface ResultMessage {
  kind: 'result';
  data: {
    analysis: Analysis;
    problems: ProblemSummary[];
  };
}

onmessage = async (event: MessageEvent<CheckPackageEventData>) => {
  const analysis = await checkPackage(event.data.packageName);
  const problems = getSummarizedProblems(analysis);
  postMessage({
    kind: 'result',
    data: {
      analysis,
      problems,
    },
  } satisfies ResultMessage);
};
