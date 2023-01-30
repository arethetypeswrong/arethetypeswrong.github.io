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
  messages: {
    messageText: string;
    messageHtml: string;
  }[];
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

export function groupResolutionProblemsByKind(
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
  const grouped = groupResolutionProblemsByKind(problems);
  const result: ResolutionProblemSummary[] = [];
  for (const kind in grouped) {
    const problems = grouped[kind as ResolutionProblemKind]!;
    const summary: ResolutionProblemSummary = {
      kind: problems[0].kind,
      title: problemTitles[problems[0].kind],
      messages: getMessages(problems[0].kind, analysis, problems),
    };
    result.push(summary);
  }
  return result;
}

function getMessages(kind: ResolutionProblemKind, analysis: TypedAnalysis, problems: ResolutionProblem[]) {
  if (kind === "Wildcard") {
    return [msg(() => `Wildcards cannot yet be analyzed by this tool.`)];
  }

  const allEntrypoints = new Set(Object.keys(analysis.entrypointResolutions));
  const groupedByEntrypoint = groupByEntrypoint(problems);
  const groupedByResolutionKind = groupByResolutionKind(problems);
  const fullRows = Object.keys(groupedByResolutionKind)
    .map((resolutionKind) => {
      const problems = groupedByResolutionKind[resolutionKind as ResolutionKind];
      return problems?.length === allEntrypoints.size ? problems : undefined;
    })
    .filter((g): g is ResolutionProblem[] => !!g);
  const fullColumns = Object.keys(groupedByEntrypoint)
    .map((entrypoint) => {
      const problems = groupedByEntrypoint[entrypoint];
      return problems?.length === allResolutionKinds.length ? problems : undefined;
    })
    .filter((g): g is ResolutionProblem[] => !!g);

  const messages: { messageText: string; messageHtml: string }[] = [];

  if (fullRows.length > 0) {
    messages.push(
      msg((f) => {
        const resolutionKinds = formatResolutionKinds(
          fullRows.map((r) => r[0].resolutionKind),
          f
        );
        return getMessageText(resolutionKinds, allEntrypoints.size === 1 ? "the package" : f.strong("all entrypoints"));
      })
    );
  }

  if (fullRows.length === allResolutionKinds.length) {
    return messages;
  }

  if (fullColumns.length > 0) {
    messages.push(
      msg((f) => {
        const entrypoints = formatEntrypoints(
          analysis.packageName,
          fullColumns.map((c) => c[0].entrypoint),
          allEntrypoints.size,
          f
        );
        return getMessageText(f.strong("all module resolution settings"), entrypoints);
      })
    );
  }

  const remainingProblems = problems.filter(
    (p) =>
      !fullRows.some((r) => r[0].resolutionKind === p.resolutionKind) &&
      !fullColumns.some((c) => c[0].entrypoint === p.entrypoint)
  );
  if (remainingProblems.length > 0) {
    const groupedByEntrypoint = groupByEntrypoint(remainingProblems);
    const groupedByResolutionKind = groupByResolutionKind(remainingProblems);
    // Report fewer, larger groups
    const biggerGroups =
      Object.keys(groupedByEntrypoint).length <= Object.keys(groupedByResolutionKind).length
        ? groupedByEntrypoint
        : groupedByResolutionKind;
    for (const groupKey in biggerGroups) {
      const entrypoints =
        biggerGroups === groupedByEntrypoint
          ? [groupKey]
          : biggerGroups[groupKey as ResolutionKind]!.map((p) => p.entrypoint);
      const resolutionKinds =
        biggerGroups === groupedByResolutionKind
          ? [groupKey as ResolutionKind]
          : biggerGroups[groupKey]!.map((p) => p.resolutionKind);
      messages.push(
        msg((f) =>
          getMessageText(
            formatResolutionKinds(resolutionKinds, f),
            formatEntrypoints(analysis.packageName, entrypoints, allEntrypoints.size, f)
          )
        )
      );
    }
  }
  return messages;

  function getMessageText(resolutionKinds: string, entrypoints: string) {
    switch (kind) {
      case "NoResolution":
        return `Imports of ${entrypoints} under ${resolutionKinds} failed to resolve.`;
      case "UntypedResolution":
        return `Imports of ${entrypoints} under ${resolutionKinds} resolved to JavaScript files, but no types.`;
      case "FalseESM":
        return `Imports of ${entrypoints} under ${resolutionKinds} resolved to ESM types, but CJS implementations.`;
      case "FalseCJS":
        return `Imports of ${entrypoints} under ${resolutionKinds} resolved to CJS types, but ESM implementations.`;
      case "CJSResolvesToESM":
        return `Imports of ${entrypoints} resolved to ES modules from a CJS importing module. CJS modules in Node will only be able to access this entrypoint with a dynamic import.`;
      case "Wildcard":
        throw new Error("Wildcard should have been handled above.");
    }
  }
}

function groupByResolutionKind(problems: ResolutionProblem[]) {
  return problems.reduce((result: Partial<Record<ResolutionKind, ResolutionProblem[]>>, problem) => {
    (result[problem.resolutionKind] ??= []).push(problem);
    return result;
  }, {});
}

function groupByEntrypoint(problems: ResolutionProblem[]) {
  return problems.reduce((result: Record<string, ResolutionProblem[]>, problem) => {
    (result[problem.entrypoint] ??= []).push(problem);
    return result;
  }, {});
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

function formatResolutionKinds(kinds: ResolutionKind[], f: Formatters) {
  if (kinds.length === 1) {
    return formatResolutionKind(kinds[0], f);
  } else if (kinds.length === 2 && kinds.includes("node16-cjs") && kinds.includes("node16-esm")) {
    return `the ${f.code("node16")} module resolution setting`;
  } else if (kinds.length === allResolutionKinds.length - 1 && !kinds.includes("node10")) {
    return f.strong("all modern module resolution settings");
  } else if (kinds.length === allResolutionKinds.length) {
    return f.strong("all module resolution settings");
  } else if (kinds.length === 2 && kinds.includes("node16-esm") && kinds.includes("bundler")) {
    return `resolution modes that use the ${f.code("import")} condition in package.json ${f.code(`"exports"`)}`;
  } else {
    return f.strong("multiple module resolution settings");
  }
}

function formatEntrypoints(packageName: string, entrypoints: string[], entrypointCount: number, f: Formatters) {
  if (entrypoints.length === 1) {
    return formatEntrypoint(packageName, entrypoints[0], f);
  }
  if (entrypoints.length === entrypointCount) {
    return f.strong("all entrypoints");
  }
  return f.strong("multiple entrypoints");
}

function formatEntrypoint(packageName: string, subpath: string, f: Formatters) {
  return f.code(`"${subpath === "." ? packageName : `${packageName}/${subpath.substring(2)}`}"`);
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
