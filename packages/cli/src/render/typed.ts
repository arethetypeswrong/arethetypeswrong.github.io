import * as core from "@arethetypeswrong/core";
import { allResolutionKinds } from "@arethetypeswrong/core/utils";
import chalk from "chalk";

import { moduleKinds, problemEmoji, resolutionKinds, problemShortDescriptions } from "../problemUtils.js";

export async function typed(analysis: core.TypedAnalysis, disableSummary?: boolean, disableEmojis?: boolean) {
  const problems = core.getProblems(analysis);

  const subpaths = Object.keys(analysis.entrypointResolutions);

  if (!disableSummary) {
    const summaries = core.summarizeProblems(problems, analysis);
    const defaultSummary = disableEmojis ? " No problems found." : " No problems found 🌟";
    const summaryTexts = summaries.map((summary) => {
      return summary.messages
        .map((message) => {
          if (disableEmojis) return "    " + message.messageText.split(". ").join(".\n    ");
          return ` ${problemEmoji[summary.kind]} ${message.messageText.split(". ").join(".\n    ")}`;
        })
        .join("\n");
    });

    console.log((summaryTexts.join("\n\n") || defaultSummary) + "\n");
  }

  const Table = await import("cli-table").then((mod) => mod.default);

  const entrypoints = subpaths.map((s) => {
    const hasProblems = problems.some((p) => p.entrypoint === s);
    const color = hasProblems ? "redBright" : "greenBright";

    if (s === ".") return chalk.bold[color](`"${analysis.packageName}"`);
    else return chalk.bold[color](`"${analysis.packageName}/${s.substring(2)}"`);
  });

  const table = new Table({
    head: ["", ...entrypoints],
    colWidths: [20, ...entrypoints.map(() => 35)],
  });

  allResolutionKinds.forEach((kind) => {
    let row = [resolutionKinds[kind]];

    row = row.concat(
      subpaths.map((subpath) => {
        const problemsForCell = problems.filter(
          (problem) => problem.entrypoint === subpath && problem.resolutionKind === kind
        );

        const resolution = analysis.entrypointResolutions[subpath][kind].resolution;

        const descriptions = problemShortDescriptions[disableEmojis ? "noEmoji" : "emoji"];

        if (problemsForCell.length) {
          return problemsForCell.map((problem) => descriptions[problem.kind]).join("\n");
        }

        const jsonResult = disableEmojis ? "OK (JSON)" : "🟢 (JSON)";

        const moduleResult = (disableEmojis ? "OK " : "🟢 ") + moduleKinds[resolution?.moduleKind?.detectedKind || ""];

        return `${resolution?.isJson ? jsonResult : moduleResult}`;
      })
    );

    table.push(row);
  });

  console.log(table.toString());
}
