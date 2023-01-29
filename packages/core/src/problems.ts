import ts from "typescript";
import type { ResolutionKind, Analysis, TypedAnalysis, UntypedAnalysis } from "./types.js";
import { allResolutionKinds } from "./utils.js";

export type ResolutionProblemKind =
  | "NoResolution"
  | "UntypedResolution"
  | "FalseESM"
  | "FalseCJS"
  | "CJSResolvesToESM"
  | "Wildcard";

export type ProblemKind = ResolutionProblemKind | "NoTypes";

export type Problem = NoTypesProblem | ResolutionProblem;

export interface NoTypesProblem {
  kind: "NoTypes";
}

export interface ResolutionProblem {
  kind: ResolutionProblemKind;
  entrypoint: string;
  resolutionKind: ResolutionKind;
}

export type ProblemSummary = NoTypesProblemSummary | ResolutionProblemSummary;

export interface NoTypesProblemSummary {
  kind: "NoTypes";
  title: string;
  messageText: string;
  messageHtml: string;
}

export interface ResolutionProblemSummary {
  kind: ResolutionProblemKind;
  title: string;
  affectedEntrypoints: string[];
  affectedResolutionKinds: ResolutionKind[];
  messageText: string;
  messageHtml: string;
}

const problemTitles: Record<ProblemKind, string> = {
  Wildcard: "Wildcards",
  NoTypes: "No types found",
  NoResolution: "Resolution failed",
  UntypedResolution: "Could not find types",
  FalseESM: "Types are ESM, but implementation is CJS",
  FalseCJS: "Types are CJS, but implementation is ESM",
  CJSResolvesToESM: "Entrypoint is ESM-only",
};

const moduleResolutionKinds: Record<ResolutionKind, string> = {
  node10: "node10",
  "node16-cjs": "node16",
  "node16-esm": "node16",
  bundler: "bundler",
};

export function getSummarizedProblems(analysis: Analysis): ProblemSummary[] {
  return analysis.containsTypes
    ? summarizeResolutionProblems(getProblems(analysis), analysis)
    : getProblems(analysis).map((p) => ({
        kind: p.kind,
        title: problemTitles[p.kind],
        messageText: "This package does not contain types.",
        messageHtml: "This package does not contain types.",
      }));
}

export function getProblems(result: UntypedAnalysis): NoTypesProblem[];
export function getProblems(result: TypedAnalysis): ResolutionProblem[];
export function getProblems(result: Analysis): Problem[] {
  if (!result.containsTypes) {
    return [
      {
        kind: "NoTypes",
      },
    ];
  }
  const problems: ResolutionProblem[] = [];
  for (const subpath in result.entrypointResolutions) {
    const entrypoint = result.entrypointResolutions[subpath];
    for (const kind in entrypoint) {
      const resolutionKind = kind as keyof typeof entrypoint;
      const result = entrypoint[resolutionKind];
      if (result.isWildcard) {
        problems.push({
          kind: "Wildcard",
          entrypoint: subpath,
          resolutionKind,
        });
        continue;
      }
      if (!result.resolution) {
        problems.push({
          kind: "NoResolution",
          entrypoint: subpath,
          resolutionKind,
        });
      } else if (!result.resolution.isTypeScript) {
        problems.push({
          kind: "UntypedResolution",
          entrypoint: subpath,
          resolutionKind,
        });
      }

      const { resolution, implementationResolution } = result;
      if (
        resolution?.moduleKind === ts.ModuleKind.ESNext &&
        implementationResolution?.moduleKind === ts.ModuleKind.CommonJS
      ) {
        problems.push({
          kind: "FalseESM",
          entrypoint: subpath,
          resolutionKind,
        });
      } else if (
        resolution?.moduleKind === ts.ModuleKind.CommonJS &&
        implementationResolution?.moduleKind === ts.ModuleKind.ESNext
      ) {
        problems.push({
          kind: "FalseCJS",
          entrypoint: subpath,
          resolutionKind,
        });
      }

      if (resolutionKind === "node16-cjs" && resolution?.moduleKind === ts.ModuleKind.ESNext) {
        problems.push({
          kind: "CJSResolvesToESM",
          entrypoint: subpath,
          resolutionKind,
        });
      }
    }
  }
  return problems;
}

export function groupResolutionProblems(
  problems: ResolutionProblem[]
): Partial<Record<ResolutionProblemKind, ResolutionProblem[]>> {
  const result: Partial<Record<ResolutionProblemKind, ResolutionProblem[]>> = {};
  for (const problem of problems) {
    (result[problem.kind] ??= []).push(problem);
  }
  return result;
}

export function isResolutionProblem(problem: Problem): problem is ResolutionProblem {
  return problem.kind !== "NoTypes";
}

export function summarizeResolutionProblems(problems: ResolutionProblem[], analysis: TypedAnalysis): ProblemSummary[] {
  const grouped = groupResolutionProblems(problems);
  const result: ResolutionProblemSummary[] = [];
  for (const kind in grouped) {
    const problems = grouped[kind as ResolutionProblemKind]!;
    const affectedEntrypoints = new Set(problems.map((p) => p.entrypoint));
    const affectedResolutionKinds = new Set(problems.map((p) => p.resolutionKind));
    const summary: ResolutionProblemSummary = {
      kind: problems[0].kind,
      title: problemTitles[problems[0].kind],
      affectedEntrypoints: Array.from(affectedEntrypoints),
      affectedResolutionKinds: Array.from(affectedResolutionKinds),
      ...getMessage(problems[0].kind, Array.from(affectedEntrypoints), Array.from(affectedResolutionKinds), analysis),
    };
    result.push(summary);
  }
  return result;
}

function getMessage(
  kind: ResolutionProblemKind,
  affectedEntrypoints: string[],
  affectedResolutionKinds: ResolutionKind[],
  analysis: TypedAnalysis
) {
  affectedResolutionKinds = affectedResolutionKinds.slice().sort();
  const allEntrypoints = new Set(Object.keys(analysis.entrypointResolutions));
  const affectsAllEntrypoints = affectedEntrypoints.length === allEntrypoints.size;
  const affectsAllResolutionKinds = affectedResolutionKinds.length === allResolutionKinds.length;
  const affectsAllNode16 =
    affectsAllResolutionKinds ||
    (affectedResolutionKinds.includes("node16-cjs") && affectedResolutionKinds.includes("node16-esm"));
  const affectsSomeNode16 =
    affectedResolutionKinds.includes("node16-cjs") || affectedResolutionKinds.includes("node16-esm");
  return msg((f) => {
    const entrypoints =
      allEntrypoints.size === 1
        ? "the package"
        : affectsAllEntrypoints
        ? f.strong("all entrypoints")
        : affectedEntrypoints.length === 1
        ? `the ${f.code(`"${formatEntrypoint(analysis.packageName, affectedEntrypoints[0])}"`)} entrypoint`
        : f.strong(`${affectedEntrypoints.length} entrypoints`);

    const affectsSingleResolutionSetting =
      affectedResolutionKinds.length === 1 || (affectedResolutionKinds.length === 2 && affectsAllNode16);

    let resolutionSettings = "";
    if (affectsSingleResolutionSetting) {
      resolutionSettings = ` when compiled under ${formatResolutionKind(affectedResolutionKinds[0], f)}`;
    } else if (!affectsAllResolutionKinds) {
      if (affectsAllNode16 || !affectsSomeNode16) {
        resolutionSettings =
          " when compiled under the " +
          affectedResolutionKinds.map((k) => f.code(moduleResolutionKinds[k])).join(" or ") +
          " module resolution settings";
      } else {
        const needsComma = affectedResolutionKinds.length > 2;
        resolutionSettings =
          " when compiled under the " +
          affectedResolutionKinds
            .slice(0, -1)
            .map((k) => f.code(moduleResolutionKinds[k]))
            .join(", ") +
          `${needsComma ? "," : ""} or ${formatResolutionKind(
            affectedResolutionKinds[affectedResolutionKinds.length - 1],
            f
          )}`;
      }
    }

    switch (kind) {
      case "Wildcard":
        return `Wildcards cannot yet be analyzed by this tool.`;
      case "NoResolution":
        return `Imports of ${entrypoints}${resolutionSettings} failed to resolve.`;
      case "UntypedResolution":
        return `Imports of ${entrypoints}${resolutionSettings} resolved to JavaScript files, but no types.`;
      case "FalseESM":
        return `Imports of ${entrypoints}${resolutionSettings} resolved to ESM types, but CJS implementations.`;
      case "FalseCJS":
        return `Imports of ${entrypoints}${resolutionSettings} resolved to CJS types, but ESM implementations.`;
      case "CJSResolvesToESM":
        return (
          `Imports of ${entrypoints} only resolved to ${
            affectedEntrypoints.length === 1 ? "an ES module" : "ES modules"
          } ` +
          `even when the importing module is CJS. CJS modules in Node will only be able to access this entrypoint with ` +
          `a dynamic import.`
        );
    }
  });
}

function formatResolutionKind(kind: ResolutionKind, f: Formatters) {
  switch (kind) {
    case "node10":
    case "bundler":
      return `the ${f.code(moduleResolutionKinds[kind])} module resolution setting`;
    case "node16-cjs":
      return (
        `the ${f.code("node16")} module resolution setting when the importing module is CJS ` +
        `(its extension is ${f.code(".cts")} or ${f.code(".cjs")}, or it has a ` +
        `${f.code(".ts")} or ${f.code(".js")} extension and is in scope of a ${f.code("package.json")} ` +
        `that does not contain ${f.code('"type": "module"')})`
      );
    case "node16-esm":
      return (
        `the ${f.code("node16")} module resolution setting when the importing module is ESM ` +
        `(its extension is ${f.code(".mts")} or ${f.code(".mjs")}, or it has a ` +
        `${f.code(".ts")} or ${f.code(".js")} extension and is in scope of a ${f.code("package.json")} ` +
        `that contains ${f.code('"type": "module"')})`
      );
  }
}

function formatEntrypoint(packageName: string, subpath: string) {
  return subpath === "." ? packageName : `${packageName}/${subpath.substring(2)}`;
}

type Formatters = Record<"strong" | "em" | "code", (text: string) => string>;
const identity = <T>(x: T) => x;
const textFormatters: Formatters = {
  strong: identity,
  em: identity,
  code: (text) => "`" + text + "`",
};
const htmlFormatters: Formatters = {
  strong: (text) => `<strong>${text}</strong>`,
  em: (text) => `<em>${text}</em>`,
  code: (text) => `<code>${text}</code>`,
};

function msg(cb: (format: Formatters) => string): { messageText: string; messageHtml: string } {
  return {
    messageText: cb(textFormatters),
    messageHtml: cb(htmlFormatters),
  };
}
