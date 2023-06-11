import type { CheckResult } from "@arethetypeswrong/core";

export function Details(props: { analysis?: CheckResult }) {
  if (!props.analysis) {
    return {
      className: "display-none",
      innerHTML: "",
    };
  }

  return {
    className: "",
    innerHTML: `<summary>Details</summary>
      <pre>${JSON.stringify(props.analysis, null, 2)}</pre>`,
  };
}
