import ts from "typescript";
import type { ResolutionKind, TypedAnalysis } from "./types.js";
import { allResolutionKinds } from "./utils.js";

export type ProblemKind =
  | "NoResolution"
  | "UntypedResolution"
  | "FalseESM"
  | "FalseCJS"
  | "CJSResolvesToESM"
  | "Wildcard"
  | "FallbackCondition"
  | "CJSOnlyExportsDefault"
  | "FalseExportDefault";

export interface Problem {
  kind: ProblemKind;
  entrypoint: string;
  resolutionKind: ResolutionKind;
}

export interface ProblemSummary {
  kind: ProblemKind;
  title: string;
  messages: {
    messageText: string;
    messageHtml: string;
  }[];
}

const problemTitles: Record<ProblemKind, string> = {
  Wildcard: "Wildcards",
  NoResolution: "Resolution failed",
  UntypedResolution: "Could not find types",
  FalseESM: "Types are ESM, but implementation is CJS",
  FalseCJS: "Types are CJS, but implementation is ESM",
  CJSResolvesToESM: "Entrypoint is ESM-only",
  FallbackCondition: "Resloved through fallback condition",
  CJSOnlyExportsDefault: "CJS module uses default export",
  FalseExportDefault: "Types incorrectly use default export",
};

const moduleResolutionKinds: Record<ResolutionKind, string> = {
  node10: "node10",
  "node16-cjs": "node16",
  "node16-esm": "node16",
  bundler: "bundler",
};

export function getSummarizedProblems(analysis: TypedAnalysis): ProblemSummary[] {
  return summarizeProblems(getProblems(analysis), analysis);
}

export function getProblems(analysis: TypedAnalysis): Problem[] {
  const problems: Problem[] = [];
  for (const subpath in analysis.entrypointResolutions) {
    const entrypoint = analysis.entrypointResolutions[subpath];
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
      } else if (!result.resolution.isTypeScript && !result.resolution.isJson) {
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

      if (resolution && resolvedThroughFallback(result.trace)) {
        problems.push({
          kind: "FallbackCondition",
          entrypoint: subpath,
          resolutionKind,
        });
      }

      const typesModule = resolution && analysis.fileExports[resolution.fileName];
      const jsModule = implementationResolution && analysis.fileExports[implementationResolution.fileName];
      if (resolutionKind === "node16-esm" && resolution && implementationResolution && typesModule && jsModule) {
        if (typesModule.default && jsModule[ts.InternalSymbolName.ExportEquals]) {
          problems.push({
            kind: "FalseExportDefault",
            entrypoint: subpath,
            resolutionKind,
          });
        } else if (
          typesModule.default &&
          jsModule.default &&
          jsModule.__esModule &&
          !typesModule[ts.InternalSymbolName.ExportEquals] &&
          !jsModule[ts.InternalSymbolName.ExportEquals]
        ) {
          problems.push({
            kind: "CJSOnlyExportsDefault",
            entrypoint: subpath,
            resolutionKind,
          });
        }
      }
    }
  }
  return problems;
}

export function resolvedThroughFallback(traces: string[]) {
  let i = 0;
  while (i < traces.length) {
    i = traces.indexOf("Entering conditional exports.", i);
    if (i === -1) {
      return false;
    }
    if (conditionalExportsResolvedThroughFallback()) {
      return true;
    }
  }

  function conditionalExportsResolvedThroughFallback(): boolean {
    i++;
    let seenFailure = false;
    for (; i < traces.length; i++) {
      if (traces[i].startsWith("Failed to resolve under condition '")) {
        seenFailure = true;
      } else if (seenFailure && traces[i].startsWith("Resolved under condition '")) {
        return true;
      } else if (traces[i] === "Entering conditional exports.") {
        if (conditionalExportsResolvedThroughFallback()) {
          return true;
        }
      } else if (traces[i] === "Exiting conditional exports.") {
        return false;
      }
    }
    return false;
  }
}

export function groupByKind(problems: Problem[]): Partial<Record<ProblemKind, Problem[]>> {
  const result: Partial<Record<ProblemKind, Problem[]>> = {};
  for (const problem of problems) {
    (result[problem.kind] ??= []).push(problem);
  }
  return result;
}

export function summarizeProblems(problems: Problem[], analysis: TypedAnalysis): ProblemSummary[] {
  const grouped = groupByKind(problems);
  const result: ProblemSummary[] = [];
  for (const kind in grouped) {
    const problems = grouped[kind as ProblemKind]!;
    const summary: ProblemSummary = {
      kind: problems[0].kind,
      title: problemTitles[problems[0].kind],
      messages: getMessages(problems[0].kind, analysis, problems),
    };
    result.push(summary);
  }
  return result;
}

function getMessages(kind: ProblemKind, analysis: TypedAnalysis, problems: Problem[]) {
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
    .filter((g): g is Problem[] => !!g);
  const fullColumns = Object.keys(groupedByEntrypoint)
    .map((entrypoint) => {
      const problems = groupedByEntrypoint[entrypoint];
      return problems?.length === allResolutionKinds.length ? problems : undefined;
    })
    .filter((g): g is Problem[] => !!g);

  const messages: { messageText: string; messageHtml: string }[] = [];

  if (fullRows.length > 0) {
    messages.push(
      msg((f) => {
        const resolutionKinds = formatResolutionKinds(
          fullRows.map((r) => r[0].resolutionKind),
          f
        );
        return getMessageText(
          resolutionKinds,
          allEntrypoints.size === 1 ? "the package" : f.strong("all entrypoints"),
          f
        );
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
        return getMessageText(f.strong("all module resolution settings"), entrypoints, f);
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
            formatEntrypoints(analysis.packageName, entrypoints, allEntrypoints.size, f),
            f
          )
        )
      );
    }
  }
  return messages;

  function getMessageText(resolutionKinds: string, entrypoints: string, f: Formatters) {
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
      case "FallbackCondition":
        return (
          `Imports of ${entrypoints} under ${resolutionKinds} resolved through a conditional package.json export, but ` +
          `only after failing to resolve through an earlier condition. This behavior is a ${f.a(
            "TypeScript bug",
            "https://github.com/microsoft/TypeScript/issues/50762"
          )} and should not be relied upon.`
        );
      case "CJSOnlyExportsDefault":
        // Only issued in node16-esm
        return (
          `The CJS module resolved at ${entrypoints} under contains a simulated ` +
          `${f.code("export default")} with an ${f.code("__esModule")} marker, but no top-level ` +
          `${f.code("module.exports")}. Node does not respect the ${f.code("__esModule")} marker, ` +
          `so accessing the intended default export will require a ${f.code(".default")} property ` +
          `access in Node from an ES module.`
        );
      case "FalseExportDefault":
        // Only issued in node16-esm
        return (
          `The types resolved at ${entrypoints} use ${f.code("export default")} where the implementation ` +
          `appears to use ${f.code("module.exports =")}. Node treats a default import of these constructs from an ` +
          `ES module differently, so these types will make TypeScript under the ${f.code("node16")} resolution mode ` +
          `think an extra ${f.code(".default")} property access is required, but that will likely fail at runtime ` +
          `in Node. These types should use ${f.code("export =")} instead of ${f.code("export default")}.`
        );
    }
  }
}

function groupByResolutionKind(problems: Problem[]) {
  return problems.reduce((result: Partial<Record<ResolutionKind, Problem[]>>, problem) => {
    (result[problem.resolutionKind] ??= []).push(problem);
    return result;
  }, {});
}

function groupByEntrypoint(problems: Problem[]) {
  return problems.reduce((result: Record<string, Problem[]>, problem) => {
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

type Formatters = Record<"strong" | "em" | "code", (text: string) => string> & {
  a: (text: string, href: string) => string;
};
const identity = <T>(x: T) => x;
const textFormatters: Formatters = {
  strong: identity,
  em: identity,
  code: (text) => "`" + text + "`",
  a: (text, href) => `${text} (${href})`,
};
const htmlFormatters: Formatters = {
  strong: (text) => `<strong>${text}</strong>`,
  em: (text) => `<em>${text}</em>`,
  code: (text) => `<code>${nonBreaking(text)}</code>`,
  a: (text, href) => `<a href="${href}">${text}</a>`,
};

function nonBreaking(text: string) {
  return text.length < 20 ? text.replace(/ /g, "\u00a0") : text;
}

function msg(cb: (format: Formatters) => string): { messageText: string; messageHtml: string } {
  return {
    messageText: cb(textFormatters),
    messageHtml: cb(htmlFormatters),
  };
}
