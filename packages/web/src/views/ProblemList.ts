import type { Problem, ProblemSummary } from "@arethetypeswrong/core";
import type { Checks } from "../state";
import { problemEmoji } from "./problemEmoji";

export function ProblemList(props: { checks?: Checks }) {
  if (!props.checks) {
    return {
      innerHTML: "",
    };
  }

  if (!props.checks.analysis.containsTypes) {
    return {
      innerHTML: "This package does not contain types.",
    };
  }

  if (!props.checks.problemSummaries) {
    return {
      innerHTML: "No problems found 🌟",
    };
  }

  const problems = [
    ...props.checks.problemSummaries.fileProblems,
    ...props.checks.problemSummaries.entrypointResolutionProblems,
  ];

  return {
    innerHTML: `<dl>${problems.map(problem).join("")}</dl>`,
  };
}

function problem(p: ProblemSummary<Problem>) {
  return details(
    p.message
      .map((message) => {
        return `<dt>${problemEmoji[p.kind]}</dt><dd>${message.messageHtml}</dd>`;
      })
      .join(""),
    ""
  );
}

function details(summary: string, details: string) {
  return `<details><summary>${summary}</summary>${details}</details>`;
}
