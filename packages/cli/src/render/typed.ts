import * as core from "@arethetypeswrong/core";
import { allResolutionKinds } from "@arethetypeswrong/core/utils";
import Table, { type GenericTable, type HorizontalTableRow } from "cli-table3";
import chalk from "chalk";

import { moduleKinds, problemEmoji, resolutionKinds, problemShortDescriptions, problemFlags } from "../problemUtils.js";
import type { Opts } from "../index.js";
import { verticalTable } from "./verticalTable.js";

export async function typed(analysis: core.TypedAnalysis, opts: Opts) {
  const problems = core.getProblems(analysis).filter((problem) => !opts.ignore || !opts.ignore.includes(problem.kind));

  const subpaths = Object.keys(analysis.entrypointResolutions);

  if (opts.ignore && opts.ignore.length) {
    console.log(
      chalk.gray(
        ` (ignoring rules: ${opts.ignore.map((rule) => `'${problemFlags[rule as core.ProblemKind]}'`).join(", ")})\n`
      )
    );
  }

  if (opts.summary) {
    const summaries = core.summarizeProblems(problems, analysis);
    const defaultSummary = !opts.emoji ? " No problems found." : " No problems found 🌟";
    const summaryTexts = summaries.map((summary) => {
      return summary.messages
        .map((message) => {
          if (!opts.emoji) return "    " + message.messageText.split(". ").join(".\n    ");
          return ` ${problemEmoji[summary.kind]} ${message.messageText.split(". ").join(".\n    ")}`;
        })
        .join("\n");
    });

    console.log((summaryTexts.join("\n\n") || defaultSummary) + "\n");
  }

  const entrypoints = subpaths.map((s) => {
    const hasProblems = problems.some((p) => p.entrypoint === s);
    const color = hasProblems ? "redBright" : "greenBright";

    if (s === ".") return chalk.bold[color](`"${analysis.packageName}"`);
    else return chalk.bold[color](`"${analysis.packageName}/${s.substring(2)}"`);
  });

  const table = new Table({
    head: ["", ...entrypoints],
    colWidths: [20, ...entrypoints.map(() => 35)],
  }) as GenericTable<HorizontalTableRow>;

  allResolutionKinds.forEach((kind) => {
    let row = [resolutionKinds[kind]];

    row = row.concat(
      subpaths.map((subpath) => {
        const problemsForCell = problems.filter(
          (problem) => problem.entrypoint === subpath && problem.resolutionKind === kind
        );

        const resolution = analysis.entrypointResolutions[subpath][kind].resolution;

        const descriptions = problemShortDescriptions[!opts.emoji ? "noEmoji" : "emoji"];

        if (problemsForCell.length) {
          return problemsForCell.map((problem) => descriptions[problem.kind]).join("\n");
        }

        const jsonResult = !opts.emoji ? "OK (JSON)" : "🟢 (JSON)";

        const moduleResult = (!opts.emoji ? "OK " : "🟢 ") + moduleKinds[resolution?.moduleKind?.detectedKind || ""];

        return `${resolution?.isJson ? jsonResult : moduleResult}`;
      })
    );

    table.push(row);
  });

  if (opts.vertical) {
    console.log(verticalTable(table));
  } else {
    console.log(table.toString());
  }
}
