import type { Analysis, ProblemKind, ResolutionKind } from "@arethetypeswrong/core";
import {
  allResolutionKinds,
  getResolutionOption,
  groupProblemsByKind,
  isEntrypointResolutionProblem,
  isFileProblem,
  isResolutionBasedFileProblem,
} from "@arethetypeswrong/core/utils";
import { problemEmoji } from "./problemEmoji";

const problemShortDescriptions: Record<ProblemKind, string> = {
  Wildcard: `${problemEmoji.Wildcard} Unable to check`,
  NoResolution: `${problemEmoji.NoResolution} Failed to resolve`,
  UntypedResolution: `${problemEmoji.UntypedResolution} No types`,
  FalseCJS: `${problemEmoji.FalseCJS} Masquerading as CJS`,
  FalseESM: `${problemEmoji.FalseESM} Masquerading as ESM`,
  CJSResolvesToESM: `${problemEmoji.CJSResolvesToESM} ESM (dynamic import only)`,
  FallbackCondition: `${problemEmoji.FallbackCondition} Used fallback condition`,
  FalseExportDefault: `${problemEmoji.FalseExportDefault} Incorrect default export`,
  CJSOnlyExportsDefault: `${problemEmoji.CJSOnlyExportsDefault} CJS default export`,
  InternalResolutionError: `${problemEmoji.InternalResolutionError} Internal resolution error`,
  UnexpectedModuleSyntax: `${problemEmoji.UnexpectedModuleSyntax} Unexpected module syntax`,
};

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

export function ChecksTable(props: { analysis?: Analysis }) {
  if (!props.analysis || !props.analysis.containsTypes) {
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
                groupProblemsByKind(
                  analysis.problems.filter(
                    (problem) =>
                      (isEntrypointResolutionProblem(problem) &&
                        problem.entrypoint === subpath &&
                        problem.resolutionKind === resolutionKind) ||
                      (isResolutionBasedFileProblem(problem) &&
                        problem.resolutionOption === getResolutionOption(resolutionKind) &&
                        resolutionInfo.files?.includes(problem.fileName)) ||
                      (isFileProblem(problem) && resolutionInfo.files?.includes(problem.fileName))
                  )
                )
              );
              return `<td>${
                problemsForCell.length
                  ? problemsForCell
                      .map(
                        ([kind, problem]) =>
                          problemShortDescriptions[kind as ProblemKind] +
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
