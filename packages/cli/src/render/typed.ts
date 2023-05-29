import * as core from "@arethetypeswrong/core";
import { allResolutionKinds } from "@arethetypeswrong/core/utils";
import chalk from "chalk";
import { moduleKinds, problemEmoji, problemShortDescriptions, resolutionKinds } from "../problemEmoji.js";

function problem(p: core.ProblemSummary) {
  return p.messages
    .map((message) => {
      return ` ${problemEmoji[p.kind]} ${message.messageText.split(". ").join(".\n    ")}`;
    })
    .join("\n");
}

export async function typed(analysis: core.TypedAnalysis, disableSummary?: boolean) {
  const subpaths = Object.keys(analysis.entrypointResolutions);
  const entrypoints = subpaths.map((s) =>
    s === "." ? analysis.packageName : `${analysis.packageName}/${s.substring(2)}`
  );

  const problems = core.getProblems(analysis);
  const summaries = core.summarizeProblems(problems, analysis);

  if (!disableSummary) {
    console.log(summaries.map(problem).join("\n\n") || " No problems found 🌟");
    console.log();
  }

  const Table = await import("cli-table").then((mod) => mod.default);
  const table = new Table({
    head: [
      "",
      ...entrypoints.map((ep, i) =>
        chalk.bold[problems.some((problem) => problem.entrypoint === subpaths[i]) ? "redBright" : "greenBright"](
          `"${ep}"`
        )
      ),
    ],
    colWidths: [20, ...entrypoints.map(() => 35)],
  });

  allResolutionKinds.forEach((kind) => {
    const row: string[] = [];

    row.push(resolutionKinds[kind]);

    subpaths
      .map((subpath) => {
        const problemsForCell = problems?.filter(
          (problem) => problem.entrypoint === subpath && problem.resolutionKind === kind
        );
        const resolution = analysis.entrypointResolutions[subpath][kind].resolution;
        return `${problemsForCell?.length
            ? problemsForCell.map((problem) => problemShortDescriptions[problem.kind]).join("\n")
            : resolution?.isJson
              ? "🟢 (JSON)"
              : "🟢 " + moduleKinds[resolution?.moduleKind?.detectedKind || ""]
          }`;
      })
      .forEach((cell) => {
        row.push(cell);
      });

    table.push(row);
  });

  console.log(table.toString());
}
