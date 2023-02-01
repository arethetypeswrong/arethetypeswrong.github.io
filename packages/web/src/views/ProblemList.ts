import type { ProblemSummary } from "are-the-types-wrong-core";
import { problemEmoji } from "./problemEmoji";

export function ProblemList(props: { problems?: ProblemSummary[] }) {
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

function problem(p: ProblemSummary) {
  return p.kind === "NoTypes"
    ? `<dt>${problemEmoji.NoTypes}</dt><dd>This packge does not contain types.</dd>`
    : p.messages
        .map((message) => {
          return `<dt>${problemEmoji[p.kind]}</dt><dd>${message.messageHtml}</dd>`;
        })
        .join("");
}
