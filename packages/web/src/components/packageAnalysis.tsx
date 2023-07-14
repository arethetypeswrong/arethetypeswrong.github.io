// Top level component for rendering a package analysis result.

import type { Analysis, Problem, ProblemKind, ResolutionKind } from "@arethetypeswrong/core";
import { filterProblems, problemKindInfo, problemsByKind } from "@arethetypeswrong/core/problems";
import { allResolutionKinds, groupProblemsByKind } from "@arethetypeswrong/core/utils";
import Details from "./details";

type PackageAnalysisProps = {
  analysis: Analysis;
};

export default function PackageAnalysis({ analysis }: PackageAnalysisProps) {
  return (
    <div>
      <h2>
        {analysis.packageName} v{analysis.packageVersion}{" "}
        <small>
          (
          <a href={`https://npmjs.com/${analysis.packageName}`} target="_blank">
            npm
          </a>
          ,
          <a href={`https://unpkg.com/browse/${analysis.packageName}@${analysis.packageVersion}/`} target="_blank">
            unpkg
          </a>
          )
        </small>
      </h2>
      <EntryPointTable analysis={analysis} />
      <Details analysis={analysis} />
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
    <table id="resolutions">
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
          <tr key={kind}>
            <td>{kind}</td>
            {entrypoints.map((entrypoint) => (
              <TableData key={kind + entrypoint} kind={kind} entrypoint={entrypoint} analysis={analysis} />
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
    <div id="problems">
      <dl>
        {Object.keys(byKind).map((kind, i) => {
          const info = problemKindInfo[kind as keyof typeof problemKindInfo];

          return (
            <div key={i}>
              <dt>{info.emoji}</dt>
              <dd>
                <p>
                  <strong>
                    <a target="_blank" href={info.docsUrl}>
                      {info.title}
                    </a>
                  </strong>
                </p>
                <p>{info.description}</p>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
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
