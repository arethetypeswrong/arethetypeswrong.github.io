// Top level component for rendering a package analysis result.

import type { Analysis, Problem, ProblemKind, ResolutionKind } from "@arethetypeswrong/core";
import { filterProblems, problemKindInfo, problemsByKind } from "@arethetypeswrong/core/problems";
import { allResolutionKinds, groupProblemsByKind } from "@arethetypeswrong/core/utils";

type PackageAnalysisProps = {
  analysis: Analysis;
};

export default function PackageAnalysis({ analysis }: PackageAnalysisProps) {
  return (
    <div>
      <h2>
        {analysis.packageName} v{analysis.packageVersion}
      </h2>
      <p>Package {analysis.types ? "includes" : "does not include"} types</p>
      <EntryPointTable analysis={analysis} />
    </div>
  );
}

function EntryPointTable({ analysis }: { analysis: Analysis }) {
  return (
    <>
      <div>
        <UniqueProblemTypes problems={analysis.problems} />
        <ProblemTable analysis={analysis} packageName={analysis.packageName} />
      </div>
    </>
  );
}

function ProblemTable({ analysis, packageName }: { analysis: Analysis; packageName: string }) {
  const entrypoints = Object.keys(analysis.entrypoints);

  return (
    <table>
      <thead>
        <tr>
          <th></th>
          {entrypoints.map((entrypoint) => (
            <th key={entrypoint}>{entrypoint.replace(".", packageName)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {allResolutionKinds.map((kind) => (
          <tr>
            <td>{kind}</td>
            {entrypoints.map((entrypoint) => (
              <TableData kind={kind} entrypoint={entrypoint} analysis={analysis} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableData({ kind, entrypoint, analysis }: { kind: ResolutionKind; entrypoint: string; analysis: Analysis }) {
  const resolutionInfo = analysis.entrypoints[entrypoint].resolutions[kind];
  const problemsForCell = Object.entries(
    groupProblemsByKind(filterProblems(analysis, { resolutionKind: kind, entrypoint }))
  );

  console.log(problemsForCell);
  return (
    <td>
      {problemsForCell.length
        ? problemsForCell
            .map(
              ([kind, problem]) =>
                problemKindInfo[kind as ProblemKind].emoji +
                " " +
                problemKindInfo[kind as ProblemKind].shortDescription +
                (problem.length > 1 ? ` (${problem.length})` : "")
            )
            .join(" ")
        : resolutionInfo.resolution?.isJson
        ? "✅ (JSON)"
        : "✅ " + moduleKinds[resolutionInfo.resolution?.moduleKind?.detectedKind || ""]}
    </td>
  );
}

function UniqueProblemTypes({ problems }: { problems: Problem[] }) {
  const byKind = problemsByKind(problems);

  return (
    <ul>
      {Object.keys(byKind).map((kind) => {
        const info = problemKindInfo[kind as keyof typeof problemKindInfo];

        return (
          <li>
            <p>{info.emoji} </p>
            <a href={info.docsUrl}>{info.title}</a>
            <p>{info.description}</p>
          </li>
        );
      })}
    </ul>
  );
}

///////////////
// helpers
///////////////

const moduleKinds = {
  1: "(CJS)",
  99: "(ESM)",
  "": "",
};
