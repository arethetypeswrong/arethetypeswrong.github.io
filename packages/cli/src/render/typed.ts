import * as core from "@arethetypeswrong/core";
import { allResolutionKinds } from "@arethetypeswrong/core/utils";
import chalk from "chalk";

import { moduleKinds, problemEmoji, problemShortDescriptions, resolutionKinds } from "../problemUtils.js";

export async function typed(analysis: core.TypedAnalysis, disableSummary?: boolean, disableEmojis?: boolean) {
  const problems = core.getProblems(analysis);

  const subpaths = Object.keys(analysis.entrypointResolutions);

  if (!disableSummary) {
    const summaries = core.summarizeProblems(problems, analysis);
    const defaultSummary = disableEmojis ? " No problems found." : " No problems found 🌟";
    console.log((summaries.map(renderProblem).join("\n\n") || defaultSummary) + "\n");
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

        if (problemsForCell.length) {
          return problemsForCell.map((problem) => problemShortDescriptions[problem.kind]).join("\n");
        }

        return `${resolution?.isJson ? "🟢 (JSON)" : "🟢 " + moduleKinds[resolution?.moduleKind?.detectedKind || ""]}`;
      })
    );

    table.push(row);
  });

  console.log(table.toString());
}

function renderProblem(p: core.ProblemSummary) {
  return p.messages
    .map((message) => {
      return ` ${problemEmoji[p.kind]} ${message.messageText.split(". ").join(".\n    ")}`;
    })
    .join("\n");
}
