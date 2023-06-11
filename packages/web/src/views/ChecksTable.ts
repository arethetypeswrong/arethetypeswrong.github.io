import type { CheckResult, ProblemKind, ResolutionKind } from "@arethetypeswrong/core";
import { filterProblems, problemKindInfo } from "@arethetypeswrong/core/problems";
import { allResolutionKinds, groupProblemsByKind } from "@arethetypeswrong/core/utils";

const resolutionKinds: Record<ResolutionKind, string> = {
  node10: "<code>node10</code>",
  "node16-cjs": "<code>node16</code> (from CJS)",
  "node16-esm": "<code>node16</code> (from ESM)",
  bundler: "<code>bundler</code>",
};

const moduleKinds = {
  1: "(CJS)",
  99: "(ESM)",
  "": "",
};

export function ChecksTable(props: { analysis?: CheckResult }) {
  if (!props.analysis || !props.analysis.types) {
    return {
      className: "display-none",
      innerHTML: "",
    };
  }

  const { analysis } = props;
  const subpaths = Object.keys(analysis.entrypoints);
  const entrypoints = subpaths.map((s) =>
    s === "." ? analysis.packageName : `${analysis.packageName}/${s.substring(2)}`
  );
  return {
    className: "",
    innerHTML: `
    <thead>
      <tr>
        <th></th>
        ${entrypoints.map((entrypoint) => `<th><code>"${entrypoint}"</code></th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${allResolutionKinds
        .map(
          (resolutionKind) => `
        <tr>
          <td>${resolutionKinds[resolutionKind]}</td>
          ${subpaths
            .map((subpath) => {
              const resolutionInfo = analysis.entrypoints[subpath].resolutions[resolutionKind];
              const problemsForCell = Object.entries(
                groupProblemsByKind(filterProblems(analysis, { resolutionKind, entrypoint: subpath }))
              );
              return `<td>${
                problemsForCell.length
                  ? problemsForCell
                      .map(
                        ([kind, problem]) =>
                          problemKindInfo[kind as ProblemKind].emoji +
                          " " +
                          problemKindInfo[kind as ProblemKind].shortDescription +
                          (problem.length > 1 ? ` (${problem.length})` : "")
                      )
                      .join("<br />")
                  : resolutionInfo.resolution?.isJson
                  ? "✅ (JSON)"
                  : "✅ " + moduleKinds[resolutionInfo.resolution?.moduleKind?.detectedKind || ""]
              }</td>`;
            })
            .join("")}
        </tr>`
        )
        .join("")}
      </tbody>`,
  };
}
