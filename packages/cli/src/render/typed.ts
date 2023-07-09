import * as core from "@arethetypeswrong/core";
import { allResolutionKinds, groupProblemsByKind } from "@arethetypeswrong/core/utils";
import chalk from "chalk";
import Table, { type GenericTable, type HorizontalTableRow } from "cli-table3";
import { marked } from "marked";

import { filterProblems, problemAffectsEntrypoint, problemKindInfo } from "@arethetypeswrong/core/problems";
import type { Opts } from "../index.js";
import { moduleKinds, problemFlags, resolutionKinds } from "../problemUtils.js";
import { asciiTable } from "./asciiTable.js";
import TerminalRenderer from "marked-terminal";

export async function typed(analysis: core.Analysis, opts: Opts) {
  const problems = analysis.problems.filter((problem) => !opts.ignoreRules || !opts.ignoreRules.includes(problem.kind));
  const grouped = groupProblemsByKind(problems);
  const entrypoints = Object.keys(analysis.entrypoints);
  marked.setOptions({
    // @ts-expect-error the types are wrong (haha)
    renderer: new TerminalRenderer(),
    mangle: false,
    headerIds: false,
  });

  if (opts.ignoreRules && opts.ignoreRules.length) {
    console.log(
      chalk.gray(
        ` (ignoring rules: ${opts.ignoreRules
          .map((rule) => `'${problemFlags[rule as core.ProblemKind]}'`)
          .join(", ")})\n`
      )
    );
  }

  if (opts.summary) {
    const defaultSummary = marked(!opts.emoji ? " No problems found" : " No problems found 🌟");
    const summaryTexts = Object.keys(grouped).map((kind) => {
      const info = problemKindInfo[kind as core.ProblemKind];
      const emoji = opts.emoji ? `${info.emoji} ` : "";
      const description = marked(`${info.description} ${info.docsUrl}`);
      return `${emoji}${description}`;
    });

    console.log(summaryTexts.join("") || defaultSummary);
  }

  const entrypointNames = entrypoints.map(
    (s) => `"${s === "." ? analysis.packageName : `${analysis.packageName}/${s.substring(2)}`}"`
  );
  const entrypointHeaders = entrypoints.map((s, i) => {
    const hasProblems = problems.some((p) => problemAffectsEntrypoint(p, s, analysis));
    const color = hasProblems ? "redBright" : "greenBright";
    return chalk.bold[color](entrypointNames[i]);
  });

  const getCellContents = memo((entrypoint: string, resolutionKind: core.ResolutionKind) => {
    const problemsForCell = groupProblemsByKind(filterProblems(problems, analysis, { entrypoint, resolutionKind }));
    const resolution = analysis.entrypoints[entrypoint].resolutions[resolutionKind].resolution;
    const kinds = Object.keys(problemsForCell) as core.ProblemKind[];
    if (kinds.length) {
      return kinds
        .map((kind) => (opts.emoji ? `${problemKindInfo[kind].emoji} ` : "") + problemKindInfo[kind].shortDescription)
        .join("\n");
    }

    const jsonResult = !opts.emoji ? "OK (JSON)" : "🟢 (JSON)";
    const moduleResult = (!opts.emoji ? "OK " : "🟢 ") + moduleKinds[resolution?.moduleKind?.detectedKind || ""];
    return resolution?.isJson ? jsonResult : moduleResult;
  });

  const flippedTable =
    opts.format === "auto" || opts.format === "table-flipped"
      ? new Table({
          head: ["", ...allResolutionKinds.map((kind) => chalk.reset(resolutionKinds[kind]))],
        })
      : undefined;
  if (flippedTable) {
    entrypoints.forEach((subpath, i) => {
      flippedTable.push([
        entrypointHeaders[i],
        ...allResolutionKinds.map((resolutionKind) => getCellContents(subpath, resolutionKind)),
      ]);
    });
  }

  const table =
    opts.format === "auto" || !flippedTable
      ? (new Table({
          head: ["", ...entrypointHeaders],
        }) as GenericTable<HorizontalTableRow>)
      : undefined;
  if (table) {
    allResolutionKinds.forEach((kind) => {
      table.push([resolutionKinds[kind], ...entrypoints.map((entrypoint) => getCellContents(entrypoint, kind))]);
    });
  }

  switch (opts.format) {
    case "table":
      console.log(table!.toString());
      break;
    case "table-flipped":
      console.log(flippedTable!.toString());
      break;
    case "ascii":
      console.log(asciiTable(table!));
      break;
    case "auto":
      const terminalWidth = process.stdout.columns || 133; // This looks like GitHub Actions' width
      if (table!.width <= terminalWidth) {
        console.log(table!.toString());
      } else if (flippedTable!.width <= terminalWidth) {
        console.log(flippedTable!.toString());
      } else {
        console.log(asciiTable(table!));
      }
      break;
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
