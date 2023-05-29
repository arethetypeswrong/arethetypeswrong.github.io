#!/usr/bin/env node

// src/index.ts
import * as core2 from "@arethetypeswrong/core";
import { program } from "commander";
import chalk2 from "chalk";
import { readFile } from "fs/promises";
import { FetchError } from "node-fetch";

// src/render/typed.ts
import * as core from "@arethetypeswrong/core";
import { allResolutionKinds } from "@arethetypeswrong/core/utils";
import chalk from "chalk";

// src/problemUtils.ts
var problemEmoji = {
  Wildcard: "\u2753",
  NoResolution: "\u{1F480}",
  UntypedResolution: "\u{1F6AB}",
  FalseCJS: "\u{1F3AD}",
  FalseESM: "\u{1F47A}",
  CJSResolvesToESM: "\u26A0\uFE0F",
  FallbackCondition: "\u{1F41B}",
  CJSOnlyExportsDefault: "\u{1F928}",
  FalseExportDefault: "\u2757\uFE0F",
  UnexpectedESMSyntax: "\u{1F6AD}",
  UnexpectedCJSSyntax: "\u{1F6B1}"
};
var problemShortDescriptions = {
  Wildcard: `${problemEmoji.Wildcard} Unable to check`,
  NoResolution: `${problemEmoji.NoResolution} Failed to resolve`,
  UntypedResolution: `${problemEmoji.UntypedResolution} No types`,
  FalseCJS: `${problemEmoji.FalseCJS} Masquerading as CJS`,
  FalseESM: `${problemEmoji.FalseESM} Masquerading as ESM`,
  CJSResolvesToESM: `${problemEmoji.CJSResolvesToESM} ESM (dynamic import only)`,
  FallbackCondition: `${problemEmoji.FallbackCondition} Used fallback condition`,
  CJSOnlyExportsDefault: `${problemEmoji.CJSOnlyExportsDefault} CJS default export`,
  FalseExportDefault: `${problemEmoji.FalseExportDefault} Incorrect default export`,
  UnexpectedESMSyntax: `${problemEmoji.UnexpectedESMSyntax} Unexpected ESM syntax`,
  UnexpectedCJSSyntax: `${problemEmoji.UnexpectedCJSSyntax} Unexpected CJS syntax`
};
var resolutionKinds = {
  node10: "node10",
  "node16-cjs": "node16 (from CJS)",
  "node16-esm": "node16 (from ESM)",
  bundler: "bundler"
};
var moduleKinds = {
  1: "(CJS)",
  99: "(ESM)",
  "": ""
};

// src/render/typed.ts
async function typed(analysis, disableSummary, disableEmojis) {
  const problems = core.getProblems(analysis);
  const subpaths = Object.keys(analysis.entrypointResolutions);
  if (!disableSummary) {
    const summaries = core.summarizeProblems(problems, analysis);
    const defaultSummary = disableEmojis ? " No problems found." : " No problems found \u{1F31F}";
    console.log((summaries.map(renderProblem).join("\n\n") || defaultSummary) + "\n");
  }
  const Table = await import("cli-table").then((mod) => mod.default);
  const entrypoints = subpaths.map((s) => {
    const hasProblems = problems.some((p) => p.entrypoint === s);
    const color = hasProblems ? "redBright" : "greenBright";
    if (s === ".")
      return chalk.bold[color](`"${analysis.packageName}"`);
    else
      return chalk.bold[color](`"${analysis.packageName}/${s.substring(2)}"`);
  });
  const table = new Table({
    head: ["", ...entrypoints],
    colWidths: [20, ...entrypoints.map(() => 35)]
  });
  allResolutionKinds.forEach((kind) => {
    let row = [resolutionKinds[kind]];
    row = row.concat(
      subpaths.map((subpath) => {
        var _a;
        const problemsForCell = problems.filter(
          (problem) => problem.entrypoint === subpath && problem.resolutionKind === kind
        );
        const resolution = analysis.entrypointResolutions[subpath][kind].resolution;
        if (problemsForCell.length) {
          return problemsForCell.map((problem) => problemShortDescriptions[problem.kind]).join("\n");
        }
        return `${(resolution == null ? void 0 : resolution.isJson) ? "\u{1F7E2} (JSON)" : "\u{1F7E2} " + moduleKinds[((_a = resolution == null ? void 0 : resolution.moduleKind) == null ? void 0 : _a.detectedKind) || ""]}`;
      })
    );
    table.push(row);
  });
  console.log(table.toString());
}
function renderProblem(p) {
  return p.messages.map((message) => {
    return ` ${problemEmoji[p.kind]} ${message.messageText.split(". ").join(".\n    ")}`;
  }).join("\n");
}

// src/render/untyped.ts
function untyped(analysis) {
  console.log("This package does not contain types.\nDetails: ", analysis);
}

// src/index.ts
program.addHelpText("before", "ATTW CLI (v0.0.1)\n").version("0.0.1").name("attw").description(
  `${chalk2.bold.blue(
    "Are the Types Wrong?"
  )} attempts to analyze npm package contents for issues with their TypeScript types,
particularly ESM-related module resolution issues.`
).argument("<package-name>", "the package to check").option("-v, --package-version <version>", "the version of the package to check").option("--no-summary", "don't print summary information about the different errors").option("-r, --raw", "output raw JSON").option("-f, --from-file", "read from a file instead of the npm registry").action(async (packageName) => {
  const { raw, packageVersion, noSummary, fromFile } = program.opts();
  let analysis;
  if (fromFile) {
    const file = await readFile(packageName);
    const data = new Uint8Array(file);
    analysis = await core2.checkTgz(data);
  } else {
    try {
      analysis = await core2.checkPackage(packageName, packageVersion);
    } catch (error) {
      if (error instanceof FetchError) {
        program.error(error.message, { code: error.code });
      }
      if (error && typeof error === "object" && "message" in error) {
        program.error(`error while checking package:
${error.message}`, {
          code: "code" in error && typeof error.code === "string" ? error.code : "UNKNOWN"
        });
      }
      program.error("unknown error while checking package", { code: "UNKNOWN" });
    }
  }
  if (raw) {
    const result = { analysis };
    if (analysis.containsTypes) {
      result.problems = core2.groupByKind(core2.getProblems(analysis));
    }
    console.log(JSON.stringify(result));
    return;
  }
  console.log();
  if (analysis.containsTypes) {
    await typed(analysis, noSummary);
  } else {
    untyped(analysis);
  }
}).parse(process.argv);
