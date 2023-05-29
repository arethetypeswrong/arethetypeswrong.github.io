import type {
  EntrypointResolutionProblem,
  EntrypointResolutionProblemKind,
  ResolutionKind,
} from "@arethetypeswrong/core";
import { allResolutionKinds, isEntrypointResolutionProblem } from "@arethetypeswrong/core/utils";
import type { Checks } from "../state";
import { problemEmoji } from "./problemEmoji";

const problemShortDescriptions: Record<EntrypointResolutionProblemKind, string> = {
  Wildcard: `${problemEmoji.Wildcard} Unable to check`,
  NoResolution: `${problemEmoji.NoResolution} Failed to resolve`,
  UntypedResolution: `${problemEmoji.UntypedResolution} No types`,
  FalseCJS: `${problemEmoji.FalseCJS} Masquerading as CJS`,
  FalseESM: `${problemEmoji.FalseESM} Masquerading as ESM`,
  CJSResolvesToESM: `${problemEmoji.CJSResolvesToESM} ESM (dynamic import only)`,
  FallbackCondition: `${problemEmoji.FallbackCondition} Used fallback condition`,
  FalseExportDefault: `${problemEmoji.FalseExportDefault} Incorrect default export`,
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

export function ChecksTable(props: { checks?: Checks }) {
  if (!props.checks || !props.checks.analysis.containsTypes) {
    return {
      className: "display-none",
      innerHTML: "",
    };
  }

  const { analysis } = props.checks;
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
              const problemsForCell = analysis.problems.filter(
                (problem): problem is EntrypointResolutionProblem =>
                  isEntrypointResolutionProblem(problem) &&
                  problem.entrypoint === subpath &&
                  problem.resolutionKind === resolutionKind
              );
              const resolution = analysis.entrypoints[subpath].resolutions[resolutionKind].resolution;
              return `<td>${
                problemsForCell?.length
                  ? problemsForCell.map((problem) => problemShortDescriptions[problem.kind]).join("<br />")
                  : resolution?.isJson
                  ? "✅ (JSON)"
                  : "✅ " + moduleKinds[resolution?.moduleKind?.detectedKind || ""]
              }</td>`;
            })
            .join("")}
        </tr>`
        )
        .join("")}
      </tbody>`,
  };
}
