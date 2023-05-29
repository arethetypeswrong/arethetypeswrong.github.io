#!/usr/bin/env node

// src/index.ts
import * as core2 from "@arethetypeswrong/core";
import { program } from "commander";
import chalk3 from "chalk";
import { readFile } from "fs/promises";
import { FetchError } from "node-fetch";

// src/render/typed.ts
import * as core from "@arethetypeswrong/core";
import { allResolutionKinds } from "@arethetypeswrong/core/utils";
import Table from "cli-table3";
import chalk2 from "chalk";

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
var withEmoji = {
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
var noEmoji = {
  Wildcard: `Unable to check`,
  NoResolution: `Failed to resolve`,
  UntypedResolution: `No types`,
  FalseCJS: `Masquerading as CJS`,
  FalseESM: `Masquerading as ESM`,
  CJSResolvesToESM: `ESM (dynamic import only)`,
  FallbackCondition: `Used fallback condition`,
  CJSOnlyExportsDefault: `CJS default export`,
  FalseExportDefault: `Incorrect default export`,
  UnexpectedESMSyntax: `Unexpected ESM syntax`,
  UnexpectedCJSSyntax: `Unexpected CJS syntax`
};
var problemShortDescriptions = {
  emoji: withEmoji,
  noEmoji
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

// src/render/verticalTable.ts
import chalk from "chalk";
function verticalTable(table) {
  return table.options.head.slice(1).map((entryPoint, i) => {
    const keyValuePairs = table.reduce((acc, cur) => {
      var _a, _b;
      const key = (_a = cur[0]) == null ? void 0 : _a.toString();
      const value = (_b = cur[i + 1]) == null ? void 0 : _b.toString();
      return acc + `${key}: ${value}
`;
    }, "");
    return `${chalk.bold.blue(entryPoint)}

${keyValuePairs}
***********************************`;
  }).join("\n\n");
}

// src/render/typed.ts
async function typed(analysis, opts) {
  const problems = core.getProblems(analysis);
  const subpaths = Object.keys(analysis.entrypointResolutions);
  if (opts.summary) {
    const summaries = core.summarizeProblems(problems, analysis);
    const defaultSummary = !opts.emoji ? " No problems found." : " No problems found \u{1F31F}";
    const summaryTexts = summaries.map((summary) => {
      return summary.messages.map((message) => {
        if (!opts.emoji)
          return "    " + message.messageText.split(". ").join(".\n    ");
        return ` ${problemEmoji[summary.kind]} ${message.messageText.split(". ").join(".\n    ")}`;
      }).join("\n");
    });
    console.log((summaryTexts.join("\n\n") || defaultSummary) + "\n");
  }
  const entrypoints = subpaths.map((s) => {
    const hasProblems = problems.some((p) => p.entrypoint === s);
    const color = hasProblems ? "redBright" : "greenBright";
    if (s === ".")
      return chalk2.bold[color](`"${analysis.packageName}"`);
    else
      return chalk2.bold[color](`"${analysis.packageName}/${s.substring(2)}"`);
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
        const descriptions = problemShortDescriptions[!opts.emoji ? "noEmoji" : "emoji"];
        if (problemsForCell.length) {
          return problemsForCell.map((problem) => descriptions[problem.kind]).join("\n");
        }
        const jsonResult = !opts.emoji ? "OK (JSON)" : "\u{1F7E2} (JSON)";
        const moduleResult = (!opts.emoji ? "OK " : "\u{1F7E2} ") + moduleKinds[((_a = resolution == null ? void 0 : resolution.moduleKind) == null ? void 0 : _a.detectedKind) || ""];
        return `${(resolution == null ? void 0 : resolution.isJson) ? jsonResult : moduleResult}`;
      })
    );
    table.push(row);
  });
  if (opts.vertical) {
    console.log(verticalTable(table));
  } else {
    console.log(table.toString());
  }
}

// src/render/untyped.ts
function untyped(analysis) {
  console.log("This package does not contain types.\nDetails: ", analysis);
}

// src/index.ts
program.addHelpText("before", "ATTW CLI (v0.0.1)\n").version("0.0.1").name("attw").description(
  `${chalk3.bold.blue(
    "Are the Types Wrong?"
  )} attempts to analyze npm package contents for issues with their TypeScript types,
particularly ESM-related module resolution issues.`
).argument("<package-name>", "the package to check").option("-v, --package-version <version>", "the version of the package to check").option("-r, --raw", "output raw JSON; overrides any rendering options").option("-f, --from-file", "read from a file instead of the npm registry").option("-E, --vertical", "display in a vertical ASCII table (like MySQL's -E option)").option("--summary, --no-summary", "whether to print summary information about the different errors", true).option("--emoji, --no-emoji", "whether to use any emojis", true).option("--color, --no-color", "whether to use any colors (the FORCE_COLOR env variable is also available)", true).action(async (packageName) => {
  const opts = program.opts();
  const { raw, packageVersion, fromFile, color } = opts;
  if (!color) {
    process.env.FORCE_COLOR = "0";
  }
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
    await typed(analysis, opts);
  } else {
    untyped(analysis);
  }
}).parse(process.argv);
