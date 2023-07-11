// Top level component for rendering a package analysis result.

import type { Analysis } from "@arethetypeswrong/core";

type PackageAnalysisProps = {
  analysis: Analysis;
};

export default function PackageAnalysis({ analysis }: PackageAnalysisProps) {
  const entrypoints = analysis.entrypoints;

  for (const k of Object.keys(entrypoints)) {
    console.log(k, entrypoints[k]);
  }

  return (
    <div>
      <h2>Package Analysis</h2>
      <p>{analysis.packageName}</p>
      <p>{analysis.packageVersion}</p>
      <p>{analysis.types}</p>
    </div>
  );
}
