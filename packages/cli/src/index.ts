#!/usr/bin/env node

import * as core from "@arethetypeswrong/core";
import { program } from "commander";
import chalk from "chalk";
import { readFile } from "fs/promises";
import { FetchError } from "node-fetch";

import * as tabular from "./render/index.js";
import { readConfig } from "./readConfig.js";

export interface Opts {
  raw?: boolean;
  packageVersion?: string;
  fromFile?: boolean;
  summary?: boolean;
  emoji?: boolean;
  vertical?: boolean;
  color?: boolean;
  strict?: boolean;
  quiet?: boolean;
  configPath?: string;
}

program
  .addHelpText("before", "ATTW CLI (v0.0.1)\n")
  .addHelpText("after", "\ncore: v0.0.6, typescript: v5.0.0-dev.20230207")
  .version("v0.0.1")
  .name("attw")
  .description(
    `${chalk.bold.blue(
      "Are the Types Wrong?"
    )} attempts to analyze npm package contents for issues with their TypeScript types,
particularly ESM-related module resolution issues.`
  )
  .argument("<package-name>", "the package to check; by default the name of an NPM package, unless --from-file is set")
  .option("-v, --package-version <version>", "the version of the package to check")
  .option("-r, --raw", "output raw JSON; overrides any rendering options")
  .option("-f, --from-file", "read from a file instead of the npm registry")
  .option("-E, --vertical", "display in a vertical ASCII table (like MySQL's -E option)")
  .option("-s, --strict", "exit if any problems are found (useful for CI)")
  .option("--summary, --no-summary", "whether to print summary information about the different errors")
  .option("--emoji, --no-emoji", "whether to use any emojis")
  .option("--color, --no-color", "whether to use any colors (the FORCE_COLOR env variable is also available)")
  .option("-q, --quiet", "don't print anything to STDOUT (overrides all other options)")
  .option("--config-path <path>", "path to config file (default: ./.attw.json)")
  .action(async (packageName: string) => {
    const opts = program.opts<Opts>();
    await readConfig(program, opts.configPath);

    if (opts.quiet) {
      console.log = () => { };
    }

    if (!opts.color) {
      process.env.FORCE_COLOR = "0";
    }

    let analysis: core.Analysis;
    if (opts.fromFile) {
      try {
        const file = await readFile(packageName);
        const data = new Uint8Array(file);
        analysis = await core.checkTgz(data);
      } catch (error) {
        handleError(error, "checking file");
      }
    } else {
      try {
        analysis = await core.checkPackage(packageName, opts.packageVersion);
      } catch (error) {
        if (error instanceof FetchError) {
          program.error(`error while fetching package:\n${error.message}`, { code: error.code });
        }

        handleError(error, "checking package");
      }
    }

    if (opts.raw) {
      const result = { analysis } as {
        analysis: core.Analysis;
        problems?: Partial<Record<core.ProblemKind, core.Problem[]>>;
      };

      if (analysis.containsTypes) {
        result.problems = core.groupByKind(core.getProblems(analysis));
      }

      console.log(JSON.stringify(result));

      if (opts.strict && analysis.containsTypes && !!core.getProblems(analysis).length) process.exit(1);

      return;
    }

    console.log();
    if (analysis.containsTypes) {
      await tabular.typed(analysis, opts);
      if (opts.strict && !!core.getProblems(analysis).length) process.exit(1);
    } else {
      tabular.untyped(analysis);
    }
  })
  .parse(process.argv);

function handleError(error: unknown, title: string): never {
  if (error && typeof error === "object" && "message" in error) {
    program.error(`error while ${title}:\n${error.message}`, {
      code: "code" in error && typeof error.code === "string" ? error.code : "UNKNOWN",
    });
  }

  program.error(`unknown error while ${title}`, { code: "UNKNOWN" });
}
