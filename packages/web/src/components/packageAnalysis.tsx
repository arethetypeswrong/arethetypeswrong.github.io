// Top level component for rendering a package analysis result.

import type { Analysis, Problem } from "@arethetypeswrong/core";
import { problemKindInfo, problemsByKind } from "@arethetypeswrong/core/problems";

type PackageAnalysisProps = {
  analysis: Analysis;
};

export default function PackageAnalysis({ analysis }: PackageAnalysisProps) {
  return (
    <div>
      <h2>Package Analysis</h2>
      <p>
        {analysis.packageName} v{analysis.packageVersion}
      </p>
      <p>Package {analysis.types ? "includes" : "does not include"} types</p>
      <EntryPointTable analysis={analysis} />
      {/* <ul>
        {subPaths.map((subPath) => (
          <li key={subPath}>{subPath}</li>
        ))}
      </ul> */}
    </div>
  );
}

function EntryPointTable({ analysis }: { analysis: Analysis }) {
  const entrypoints = Object.keys(analysis.entrypoints);
  const values = Object.values(analysis.problems);
  console.log(analysis.problems);
  console.log(values.sort((a, b) => (a.kind > b.kind ? 1 : -1)));

  const problemMap = new Map<string, Problem[]>();

  for (const problem of analysis.problems) {
    if (!problemMap.has(problem.entrypoint)) {
      problemMap.set(problem.entrypoint, []);
    }
    problemMap.get(problem.entrypoint)?.push(problem);
  }
  console.log(problemMap);

  return (
    <>
      <div>
        <UniqueProblemTypes problems={analysis.problems} />
      </div>
    </>
  );
}

function UniqueProblemTypes({ problems }: { problems: Problem[] }) {
  const byKind = problemsByKind(problems);
  console.log(byKind);

  return (
    <ul>
      {Object.keys(byKind).map((kind) => (
        <li>
          <p>
            {problemKindInfo[kind as ProblemKind].emoji} {problemKindInfo[kind as ProblemKind].title}
          </p>
          <p>{problemKindInfo[kind as ProblemKind].description}</p>
        </li>
      ))}
    </ul>
  );
}
