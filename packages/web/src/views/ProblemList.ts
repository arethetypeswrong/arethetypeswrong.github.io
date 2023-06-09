import type {
  EntrypointResolutionProblemSummary,
  FileProblemSummary,
  InternalResolutionProblem,
  ResolutionBasedFileProblemSummary,
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
      ${props.checks.problemSummaries.fileProblems.map(fileProblem).join("")}
      ${props.checks.problemSummaries.entrypointResolutionProblems.map(entrypointResolutionProblem).join("")}
      ${props.checks.problemSummaries.resolutionBasedFileProblems.map(resolutionBasedFileProblem).join("")}
      </dl>`,
  };
}

function fileProblem(summary: FileProblemSummary) {
  return `
    <dt>${problemEmoji[summary.kind]}</dt>
    <dd>
      ${summary.description}
    </dd>
  `;
}

function entrypointResolutionProblem(summary: EntrypointResolutionProblemSummary) {
  const detailedDescriptions = entrypointResolutionDetailedDescription(summary);
  return `
    <dt>${problemEmoji[summary.kind]}</dt>
    <dd>
      ${detailedDescriptions ? details(summary.description, detailedDescriptions) : summary.description}
    </dd>
  `;
}

function resolutionBasedFileProblem(summary: ResolutionBasedFileProblemSummary) {
  return `
    <dt>${problemEmoji[summary.kind]}</dt>
    <dd>
      ${summary.description}
    </dd>
  `;
}

function details(summary: string, details: string) {
  return `<details><summary>${summary}</summary>${details}</details>`;
}

function entrypointResolutionDetailedDescription(summary: EntrypointResolutionProblemSummary) {
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
      return description || undefined;
  }
}

function formatFileName(fileName: string, packageName: string) {
  return fileName.substring(`/node_modules/${packageName}/`.length);
}
