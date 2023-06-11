import type { CheckResult } from "@arethetypeswrong/core";

export function Details(props: { analysis?: CheckResult }) {
  if (!props.analysis) {
    return {
      className: "display-none",
    };
  }

  return {
    className: "",
  };
}
