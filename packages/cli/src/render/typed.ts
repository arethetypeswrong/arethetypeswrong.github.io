import * as core from "@arethetypeswrong/core";
import {
  filterProblems,
  problemAffectsEntrypoint,
  problemAffectsResolutionKind,
  problemKindInfo,
} from "@arethetypeswrong/core/problems";
import { allResolutionKinds, getResolutionOption, groupProblemsByKind } from "@arethetypeswrong/core/utils";
import chalk from "chalk";
import Table, { type GenericTable, type HorizontalTableRow } from "cli-table3";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import { moduleKinds, problemFlags, resolutionKinds } from "../problemUtils.js";
import { asciiTable } from "./asciiTable.js";
import type { RenderOptions } from "./index.js";

export async function typed(
  analysis: core.Analysis,
  {
    emoji = true,
    summary = true,
    format = "auto",
    ignoreRules = [],
    ignoreResolutions = [],
    verbose = false,
  }: RenderOptions,
): Promise<string> {
  let output = "";
  const problems = analysis.problems.filter(
    (problem) => !ignoreRules || !ignoreRules.includes(problemFlags[problem.kind]),
  );
  const internalResolutionProblems = problems.filter(
    (problem): problem is core.InternalResolutionErrorProblem => problem.kind === "InternalResolutionError",
  );
  const otherProblems = problems.filter((problem) => problem.kind !== "InternalResolutionError");
  // sort resolutions with required (impacts result) first and ignored after
  const requiredResolutions = allResolutionKinds.filter((kind) => !ignoreResolutions.includes(kind));
  const ignoredResolutions = allResolutionKinds.filter((kind) => ignoreResolutions.includes(kind));
  const resolutions = requiredResolutions.concat(ignoredResolutions);
  const entrypoints = Object.keys(analysis.entrypoints);
  marked.setOptions({
    renderer: new TerminalRenderer(),
  });

  out(`${analysis.packageName} v${analysis.packageVersion}`);
  if (analysis.types.kind === "@types") {
    out(`${analysis.types.packageName} v${analysis.types.packageVersion}`);
  }
  out();
  if (Object.keys(analysis.buildTools).length) {
    out("Build tools:");
    out(
      Object.entries(analysis.buildTools)
        .map(([tool, version]) => {
          return `- ${tool}@${version}`;
        })
        .join("\n"),
    );
    out();
  }

  if (ignoreRules && ignoreRules.length) {
    out(chalk.gray(` (ignoring rules: ${ignoreRules.map((rule) => `'${rule}'`).join(", ")})\n`));
  }
  if (ignoreResolutions && ignoreResolutions.length) {
    out(
      chalk.gray(` (ignoring resolutions: ${ignoreResolutions.map((resolution) => `'${resolution}'`).join(", ")})\n`),
    );
  }

  if (summary) {
    const defaultSummary = marked(!emoji ? " No problems found" : " No problems found 🌟");
    const grouped = groupProblemsByKind(problems);
    const summaryTexts = Object.entries(grouped).map(([kind, kindProblems]) => {
      const info = problemKindInfo[kind as core.ProblemKind];
      if (kind === "InternalResolutionError") {
        const problems = kindProblems as core.InternalResolutionErrorProblem[];
        const affectsRequiredResolution = problems.some((problem) =>
          requiredResolutions.includes(problem.resolutionKind),
        );
        const description = marked(`${info.description} ${info.docsUrl}`);
        const diagnostics = Array.from(
          new Set(
            problems.map((problem) => {
              const ignoredPrefix = ignoreResolutions.includes(problem.resolutionKind)
                ? "(ignored per resolution) "
                : "";
              return `${ignoredPrefix}${formatInternalResolutionError(problem)}`;
            }),
          ),
        )
          .map((line) => `  ${line}`)
          .join("\n");
        return `${affectsRequiredResolution ? "" : "(ignored per resolution) "}${
          emoji ? `${info.emoji} ` : ""
        }${description}${diagnostics}\n\n`;
      }
      const affectsRequiredResolution = kindProblems.some((p) =>
        requiredResolutions.some((r) => problemAffectsResolutionKind(p, r, analysis)),
      );
      const description = marked(
        `${info.description}${info.details ? ` Use \`-f json\` to see ${info.details}.` : ""} ${info.docsUrl}`,
      );
      return `${affectsRequiredResolution ? "" : "(ignored per resolution) "}${
        emoji ? `${info.emoji} ` : ""
      }${description}`;
    });

    out(summaryTexts.join("") || defaultSummary);
  }

  const tracedInternalResolutionProblems = verbose
    ? internalResolutionProblems.filter((problem) => problem.trace.length)
    : [];
  if (tracedInternalResolutionProblems.length) {
    out("Internal resolution traces:");
    for (const problem of tracedInternalResolutionProblems) {
      out();
      out(
        `Internal resolution trace for ${quote(problem.moduleSpecifier)} from entrypoint ${quote(
          getEntrypointName(problem.entrypoint, analysis.packageName),
        )} using ${problem.resolutionKind}:`,
      );
      out(problem.trace.map((line) => `  ${line}`).join("\n"));
    }
    out();
  }

  const entrypointNames = entrypoints.map(
    (s) => `"${s === "." ? analysis.packageName : `${analysis.packageName}/${s.substring(2)}`}"`,
  );
  const entrypointHeaders = entrypoints.map((s, i) => {
    const hasProblems = problems.some((p) =>
      p.kind === "InternalResolutionError" ? p.entrypoint === s : problemAffectsEntrypoint(p, s, analysis),
    );
    const color = hasProblems ? "redBright" : "greenBright";
    return chalk.bold[color](entrypointNames[i]);
  });

  const getCellContents = memo((subpath: string, resolutionKind: core.ResolutionKind) => {
    const ignoredPrefix = ignoreResolutions.includes(resolutionKind) ? "(ignored) " : "";
    const problemsForCell = groupProblemsByKind(
      filterProblems(otherProblems, analysis, { entrypoint: subpath, resolutionKind }),
    );
    const internalResolutionProblemsForCell = internalResolutionProblems.filter(
      (problem) => problem.entrypoint === subpath && problem.resolutionKind === resolutionKind,
    );
    const entrypoint = analysis.entrypoints[subpath].resolutions[resolutionKind];
    const resolution = entrypoint.resolution;
    const kinds = Object.keys(problemsForCell) as core.ProblemKind[];
    if (kinds.length || internalResolutionProblemsForCell.length) {
      const lines = kinds.map(
        (kind) =>
          ignoredPrefix + (emoji ? `${problemKindInfo[kind].emoji} ` : "") + problemKindInfo[kind].shortDescription,
      );
      lines.push(
        ...internalResolutionProblemsForCell.map(
          (problem) =>
            ignoredPrefix +
            (emoji ? `${problemKindInfo.InternalResolutionError.emoji} ` : "") +
            (verbose
              ? formatInternalResolutionError(problem)
              : `${problemKindInfo.InternalResolutionError.shortDescription}: ${quote(problem.moduleSpecifier)}`),
        ),
      );
      return lines.join("\n");
    }

    const jsonResult = !emoji ? "OK (JSON)" : "🟢 (JSON)";
    const moduleResult = entrypoint.isWildcard
      ? "(wildcard)"
      : (!emoji ? "OK " : "🟢 ") +
        moduleKinds[
          analysis.programInfo[getResolutionOption(resolutionKind)].moduleKinds?.[resolution?.fileName ?? ""]
            ?.detectedKind || ""
        ];
    return ignoredPrefix + (resolution?.isJson ? jsonResult : moduleResult);
  });

  const flippedTable =
    format === "auto" || format === "table-flipped"
      ? new Table({
          head: [
            "",
            ...resolutions.map((kind) =>
              chalk.reset(resolutionKinds[kind] + (ignoreResolutions.includes(kind) ? " (ignored)" : "")),
            ),
          ],
        })
      : undefined;
  if (flippedTable) {
    entrypoints.forEach((subpath, i) => {
      flippedTable.push([
        entrypointHeaders[i],
        ...resolutions.map((resolutionKind) => getCellContents(subpath, resolutionKind)),
      ]);
    });
  }

  const table =
    format === "auto" || !flippedTable
      ? (new Table({
          head: ["", ...entrypointHeaders],
        }) as GenericTable<HorizontalTableRow>)
      : undefined;
  if (table) {
    resolutions.forEach((kind) => {
      table.push([resolutionKinds[kind], ...entrypoints.map((entrypoint) => getCellContents(entrypoint, kind))]);
    });
  }

  switch (format) {
    case "table":
      out(table!.toString());
      break;
    case "table-flipped":
      out(flippedTable!.toString());
      break;
    case "ascii":
      out(asciiTable(table!));
      break;
    case "auto":
      const terminalWidth = process.stdout.columns || 133; // This looks like GitHub Actions' width
      if (table!.width <= terminalWidth) {
        out(table!.toString());
      } else if (flippedTable!.width <= terminalWidth) {
        out(flippedTable!.toString());
      } else {
        out(asciiTable(table!));
      }
      break;
  }

  return output.trimEnd();

  function out(s: string = "") {
    output += s + "\n";
  }
}

function memo<Args extends (string | number)[], Result>(fn: (...args: Args) => Result): (...args: Args) => Result {
  const cache = new Map();
  return (...args) => {
    const key = "" + args;
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

function formatInternalResolutionError(problem: core.InternalResolutionErrorProblem): string {
  return `${quote(problem.moduleSpecifier)} failed to resolve using ${problem.resolutionKind} from ${quote(
    problem.fileName,
  )}`;
}

function getEntrypointName(entrypoint: string, packageName: string): string {
  return entrypoint === "." ? packageName : `${packageName}/${entrypoint.replace(/^\.\//, "")}`;
}

function quote(value: string): string {
  return `'${value.replace(/'/g, "\\'")}'`;
}
