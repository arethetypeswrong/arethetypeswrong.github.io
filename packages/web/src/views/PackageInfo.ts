import type { Analysis } from "@arethetypeswrong/core/types";

export function PackageInfo({ analysis }: { analysis?: Analysis }) {
  if (!analysis) {
    return { className: "display-none" };
  }
  return {
    className: "",
    innerHTML: `
      <h2>
        ${analysis.packageName} v${analysis.packageVersion}
        <small>
          (<a href="https://npmjs.com/${analysis.packageName}">npm</a>,
          <a href="https://unpkg.com/browse/${analysis.packageName}@${analysis.packageVersion}/">unpkg</a>)
        </small>
      </h2>
      ${
        analysis.types.kind === "@types"
          ? `
        <h2>
          ${analysis.types.packageName} v${analysis.types.packageVersion}
          <small>
            (<a href="https://npmjs.com/${analysis.types.packageName}">npm</a>,
            <a href="https://unpkg.com/browse/${analysis.types.packageName}@${analysis.types.packageVersion}/">unpkg</a>,
            <a href="${analysis.types.definitelyTypedUrl}">DefinitelyTyped</a>)
          </small>
        </h2>
      `
          : ""
      }`,
  };
}
