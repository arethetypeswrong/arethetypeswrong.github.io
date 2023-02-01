import type { ResolutionKind, ResolutionProblemKind } from "are-the-types-wrong-core";
import { allResolutionKinds } from "are-the-types-wrong-core/utils";
import type { Checks } from "../state";
import { problemEmoji } from "./problemEmoji";

const problemShortDescriptions: Record<ResolutionProblemKind, string> = {
  Wildcard: `${problemEmoji.Wildcard} Unable to check`,
  NoResolution: `${problemEmoji.NoResolution} Failed to resolve`,
  UntypedResolution: `${problemEmoji.UntypedResolution} No types`,
  FalseCJS: `${problemEmoji.FalseCJS} Masquerading as CJS`,
  FalseESM: `${problemEmoji.FalseESM} Masquerading as ESM`,
  CJSResolvesToESM: `${problemEmoji.CJSResolvesToESM} ESM (dynamic import only)`,
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

  const { analysis, resolutionProblems } = props.checks;
  const subpaths = Object.keys(analysis.entrypointResolutions);
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
              const problems = resolutionProblems.filter(
                (problem) => problem.entrypoint === subpath && problem.resolutionKind === resolutionKind
              );
              return `<td>${
                problems.length
                  ? problems.map((problem) => problemShortDescriptions[problem.kind]).join("<br />")
                  : "✅ " +
                    moduleKinds[analysis.entrypointResolutions[subpath][resolutionKind].resolution?.moduleKind || ""]
              }</td>`;
            })
            .join("")}
        </tr>`
        )
        .join("")}
      </tbody>`,
  };
}
