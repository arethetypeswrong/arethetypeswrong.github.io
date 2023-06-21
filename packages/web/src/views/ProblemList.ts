import { marked } from "marked";
import type { CheckResult, ProblemKind } from "@arethetypeswrong/core";
import { problemKindInfo } from "@arethetypeswrong/core/problems";
import { groupProblemsByKind } from "@arethetypeswrong/core/utils";

export function ProblemList(props: { analysis?: CheckResult }) {
  if (!props.analysis) {
    return {
      innerHTML: "",
    };
  }

  if (!props.analysis.types) {
    return {
      innerHTML: "This package does not contain types.",
    };
  }

  if (!props.analysis.problems.length) {
    return {
      innerHTML: "No problems found 🌟",
    };
  }

  const problems = groupProblemsByKind(props.analysis.problems);
  return {
    innerHTML: `<dl>
      ${Object.entries(problems)
        .map(([kind]) => {
          const info = problemKindInfo[kind as ProblemKind];
          return `
          <dt>${info.emoji}</dt>
          <dd>
            <p><strong><a href="${info.docsUrl}">${info.shortDescription}</a></strong></p>
            ${marked.parse(info.description)}
          </dd>
        `;
        })
        .join("")}
    </dl>`,
  };
}
