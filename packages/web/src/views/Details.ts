import type { Analysis } from "@arethetypeswrong/core";

export function Details(props: { analysis?: Analysis }) {
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
