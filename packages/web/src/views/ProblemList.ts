import type {
  EntrypointResolutionProblem,
  EntrypointResolutionProblemSummary,
  FileProblem,
  InternalResolutionProblem,
  ProblemSummary,
} from "@arethetypeswrong/core";
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

  return {
    innerHTML: `<dl>
      ${props.checks.problemSummaries.fileProblems
        .map((p) => fileProblem(p, props.checks!.analysis.packageName))
        .join("")}
      ${props.checks.problemSummaries.problems.map(entrypointResolutionProblem).join("")}
      </dl>`,
  };
}

function fileProblem(summary: ProblemSummary<FileProblem>, packageName: string) {
  const detailedDescriptions = fileProblemDetailedDescription(summary, packageName);
  return `
    <dt>${problemEmoji[summary.kind]} (${summary.problems.length})</dt>
    <dd>
      ${detailedDescriptions ? details(summary.description, detailedDescriptions) : summary.description}
    </dd>
  `;
}

function entrypointResolutionProblem(summary: EntrypointResolutionProblemSummary<EntrypointResolutionProblem>) {
  const detailedDescriptions = entrypointResolutionDetailedDescription(summary);
  return `
    <dt>${problemEmoji[summary.kind]} (${summary.problems.length})</dt>
    <dd>
      ${detailedDescriptions ? details(summary.description, detailedDescriptions) : summary.description}
    </dd>
  `;
}

function details(summary: string, details: string) {
  return `<details><summary>${summary}</summary>${details}</details>`;
}

function fileProblemDetailedDescription(summary: ProblemSummary<FileProblem>, packageName: string) {
  switch (summary.kind) {
    case "InternalResolutionError":
      return `<ul>${summary.problems
        .map((p) => {
          const { error } = p as InternalResolutionProblem;
          return `<li>${formatFileName(error.fileName, packageName)}: <code>"${error.moduleSpecifier}"</code></li>`;
        })
        .join("")}</ul>`;
    case "UnexpectedModuleSyntax":
    case "CJSOnlyExportsDefault":
      return undefined;
  }
}

function entrypointResolutionDetailedDescription(
  summary: EntrypointResolutionProblemSummary<EntrypointResolutionProblem>
) {
  switch (summary.kind) {
    case "Wildcard":
      return undefined;
    case "NoResolution":
    case "UntypedResolution":
    case "FalseESM":
    case "FalseCJS":
    case "CJSResolvesToESM":
    case "FallbackCondition":
    case "FalseExportDefault":
      let description = "";
      if (
        summary.entrypointsAffected.length > 1 &&
        summary.resolutionKindsAffectedInAllEntrypoints.length === 2 &&
        summary.resolutionKindsAffected.includes("node16-esm") &&
        summary.resolutionKindsAffected.includes("bundler")
      ) {
        description +=
          "<p>This problem occurred consistenly in resolution modes that use the `import` " +
          'condition in package.json `"exports"`.</p>';
      } else if (
        summary.entrypointsAffected.length > 1 &&
        summary.resolutionKindsAffectedInAllEntrypoints.length === 1 &&
        summary.resolutionKindsAffected.includes("node16-cjs")
      ) {
        description +=
          "<p>This problem occurred consistenly in resolution modes that use the `require` " +
          'condition in package.json `"exports"`.</p>';
      }
      description += `<p>Entrypoints affected: ${summary.entrypointsAffected.join(", ")}</p>`;
      description += `<p>Resolution kinds affected: ${summary.resolutionKindsAffected.join(", ")}</p>`;
      return description;
  }
}

function formatFileName(fileName: string, packageName: string) {
  return fileName.substring(`/node_modules/${packageName}/`.length);
}
