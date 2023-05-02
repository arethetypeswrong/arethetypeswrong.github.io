import type { Problem, ProblemSummary } from "@arethetypeswrong/core";
import { problemEmoji } from "./problemEmoji";

export function ProblemList(props: { problems?: ProblemSummary<Problem>[]; containsTypes: boolean | undefined }) {
  if (props.containsTypes === false) {
    return {
      innerHTML: "This package does not contain types.",
    };
  }

  if (!props.problems) {
    return {
      innerHTML: "",
    };
  }

  if (props.problems.length === 0) {
    return {
      innerHTML: "No problems found 🌟",
    };
  }

  return {
    innerHTML: `<dl>${props.problems.map(problem).join("")}</dl>`,
  };
}

function problem(p: ProblemSummary<Problem>) {
  return p.messages
    .map((message) => {
      return `<dt>${problemEmoji[p.kind]}</dt><dd>${message.messageHtml}</dd>`;
    })
    .join("");
}
