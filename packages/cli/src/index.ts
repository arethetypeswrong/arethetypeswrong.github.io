#!/usr/bin/env node

import * as core from "@arethetypeswrong/core";
import { program } from "commander";
import * as tabular from "./render/index.js";
import chalk from "chalk";
import { readFile } from "fs/promises";

export interface Opts {
  raw?: boolean;
  packageVersion?: string;
  noSummary?: boolean;
  fromFile?: boolean;
}

program
  .addHelpText("before", "ATTW CLI (v0.0.1)\n")
  .version("0.0.1")
  .name("attw")
  .description(
    `${chalk.bold.blue(
      "Are the Types Wrong?"
    )} attempts to analyze npm package contents for issues with their TypeScript types,
particularly ESM-related module resolution issues.`
  )
  .argument("<package-name>", "the package to check")
  .option("-v, --package-version <version>", "the version of the package to check")
  .option("--no-summary", "don't print summary information about the different errors")
  .option("-r, --raw", "output raw JSON")
  .option("-f, --from-file", "read from a file instead of the npm registry")
  .action(async (packageName: string) => {
    const { raw, packageVersion, noSummary, fromFile } = program.opts<Opts>();

    let analysis: core.Analysis;
    if (fromFile) {
      const file = await readFile(packageName);
      const data = new Uint8Array(file);
      analysis = await core.checkTgz(data);
    } else {
      analysis = await core.checkPackage(packageName, packageVersion);
    }

    if (raw) {
      const result = { analysis } as any;
      if (analysis.containsTypes) {
        result.problems = core.groupByKind(core.getProblems(analysis));
      }

      console.log(JSON.stringify(result));

      return;
    }

    console.log();
    if (analysis.containsTypes) {
      await tabular.typed(analysis, noSummary);
    } else {
      tabular.untyped(analysis);
    }
  })
  .parse(process.argv);
