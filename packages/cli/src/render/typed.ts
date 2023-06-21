import * as core from "@arethetypeswrong/core";
import { allResolutionKinds, groupProblemsByKind } from "@arethetypeswrong/core/utils";
import chalk from "chalk";
import Table, { type GenericTable, type HorizontalTableRow } from "cli-table3";
import { marked } from "marked";

import { filterProblems, problemAffectsEntrypoint, problemKindInfo } from "@arethetypeswrong/core/problems";
import type { Opts } from "../index.js";
import { moduleKinds, problemFlags, resolutionKinds } from "../problemUtils.js";
import { tableFlipped } from "./tableFlipped.js";
import TerminalRenderer from "marked-terminal";

export async function typed(analysis: core.Analysis, opts: Opts) {
  const problems = analysis.problems.filter((problem) => !opts.ignoreRules || !opts.ignoreRules.includes(problem.kind));
  const grouped = groupProblemsByKind(problems);
  const subpaths = Object.keys(analysis.entrypoints);
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

  const entrypoints = subpaths.map((s) => {
    const hasProblems = problems.some((p) => problemAffectsEntrypoint(p, s, analysis));
    const color = hasProblems ? "redBright" : "greenBright";

    if (s === ".") return chalk.bold[color](`"${analysis.packageName}"`);
    else return chalk.bold[color](`"${analysis.packageName}/${s.substring(2)}"`);
  });

  if (opts.format === "table-flipped") {
    const table = new Table({
      head: ["", ...allResolutionKinds.map((kind) => chalk.reset(resolutionKinds[kind]))],
      colWidths: [20, ...allResolutionKinds.map(() => 25)],
    });

    subpaths.forEach((subpath, i) => {
      const point = entrypoints[i];
      let row = [point];

      row = row.concat(
        allResolutionKinds.map((kind) => {
          const problemsForCell = groupProblemsByKind(
            filterProblems(problems, analysis, { entrypoint: subpath, resolutionKind: kind })
          );
          const resolution = analysis.entrypoints[subpath].resolutions[kind].resolution;
          const kinds = Object.keys(problemsForCell) as core.ProblemKind[];
          if (kinds.length) {
            return kinds
              .map(
                (kind) => (opts.emoji ? `${problemKindInfo[kind].emoji} ` : "") + problemKindInfo[kind].shortDescription
              )
              .join("\n");
          }

          const jsonResult = !opts.emoji ? "OK (JSON)" : "🟢 (JSON)";
          const moduleResult = (!opts.emoji ? "OK " : "🟢 ") + moduleKinds[resolution?.moduleKind?.detectedKind || ""];
          return resolution?.isJson ? jsonResult : moduleResult;
        })
      );

      table.push(row);
    });
    console.log(table.toString());
    return;
  }

  const table = new Table({
    head: ["", ...entrypoints],
    colWidths: [20, ...entrypoints.map(() => 35)],
  }) as GenericTable<HorizontalTableRow>;

  allResolutionKinds.forEach((kind) => {
    let row = [resolutionKinds[kind]];

    row = row.concat(
      subpaths.map((subpath) => {
        const problemsForCell = groupProblemsByKind(
          filterProblems(problems, analysis, { entrypoint: subpath, resolutionKind: kind })
        );
        const resolution = analysis.entrypoints[subpath].resolutions[kind].resolution;
        const kinds = Object.keys(problemsForCell) as core.ProblemKind[];
        if (kinds.length) {
          return kinds
            .map(
              (kind) => (opts.emoji ? `${problemKindInfo[kind].emoji} ` : "") + problemKindInfo[kind].shortDescription
            )
            .join("\n");
        }

        const jsonResult = !opts.emoji ? "OK (JSON)" : "🟢 (JSON)";
        const moduleResult = (!opts.emoji ? "OK " : "🟢 ") + moduleKinds[resolution?.moduleKind?.detectedKind || ""];
        return resolution?.isJson ? jsonResult : moduleResult;
      })
    );

    table.push(row);
  });

  if (opts.format === "ascii") {
    console.log(tableFlipped(table));
  } else {
    console.log(table.toString());
  }
}
