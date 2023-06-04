#!/usr/bin/env node

import * as core from "@arethetypeswrong/core";
import { Option, program } from "commander";
import chalk from "chalk";
import { readFile } from "fs/promises";
import { FetchError } from "node-fetch";
import { createRequire } from "module";

import * as tabular from "./render/index.js";
import { readConfig } from "./readConfig.js";
import { problemFlags } from "./problemUtils.js";
import { parsePackageSpec } from "./parsePackageSpec.js";

const packageJson = createRequire(import.meta.url)("../package.json");
const version = packageJson.version;
const coreVersion = packageJson.dependencies["@arethetypeswrong/core"].substring(1);
const tsVersion = packageJson.devDependencies.typescript.substring(1);

const formats = ["table", "table-flipped", "ascii", "json"] as const;

type Format = (typeof formats)[number];

export interface Opts {
  fromNpm?: boolean;
  summary?: boolean;
  emoji?: boolean;
  color?: boolean;
  quiet?: boolean;
  configPath?: string;
  ignore?: string[];
  format: Format;
}

program
  .addHelpText("before", `ATTW CLI (v${version})\n`)
  .addHelpText("after", `\ncore: v${coreVersion}, typescript: v${tsVersion}`)
  .version(`v${version}`)
  .name("attw")
  .description(
    `${chalk.bold.blue(
      "Are the Types Wrong?"
    )} attempts to analyze npm package contents for issues with their TypeScript types,
particularly ESM-related module resolution issues.`
  )
  .argument("<file-name>", "the file to check; by default a path to a .tar.gz file, unless --from-npm is set")
  .option("-f, --from-npm", "read from the npm registry instead of a local file")
  .option("-q, --quiet", "don't print anything to STDOUT (overrides all other options)")
  .option("--summary, --no-summary", "whether to print summary information about the different errors")
  .option("--emoji, --no-emoji", "whether to use any emojis")
  .option("--color, --no-color", "whether to use any colors (the FORCE_COLOR env variable is also available)")
  .option("--config-path <path>", "path to config file (default: ./.attw.json)")
  .addOption(
    new Option("-i, --ignore <rules...>", "specify rules to ignore").choices(Object.values(problemFlags)).default([])
  )
  .addOption(new Option("-F, --format <format>", "specify the print format").choices(formats).default("table"))
  .action(async (fileName: string) => {
    const opts = program.opts<Opts>();
    await readConfig(program, opts.configPath);
    opts.ignore = opts.ignore?.map(
      (value) => Object.keys(problemFlags).find((key) => problemFlags[key as core.ProblemKind] === value) as string
    );

    if (opts.quiet) {
      console.log = () => { };
    }

    if (!opts.color) {
      process.env.FORCE_COLOR = "0";
    }

    let analysis: core.Analysis;
    if (opts.fromNpm) {
      try {
        const result = parsePackageSpec(fileName);
        if (result.status === "error") {
          program.error(result.error);
        } else {
          analysis = await core.checkPackage(result.data.packageName, result.data.version);
        }
      } catch (error) {
        if (error instanceof FetchError) {
          program.error(`error while fetching package:\n${error.message}`, { code: error.code });
        }

        handleError(error, "checking package");
      }
    } else {
      try {
        const file = await readFile(fileName);
        const data = new Uint8Array(file);
        analysis = await core.checkTgz(data);
      } catch (error) {
        handleError(error, "checking file");
      }
    }

    if (opts.format === "json") {
      const result = { analysis } as {
        analysis: core.Analysis;
        problems?: Partial<Record<core.ProblemKind, core.Problem[]>>;
      };

      if (analysis.containsTypes) {
        result.problems = core.groupByKind(core.getProblems(analysis));
      }

      console.log(JSON.stringify(result));

      if (
        analysis.containsTypes &&
        !!core.getProblems(analysis).filter((problem) => !opts.ignore.includes(problem.kind)).length
      )
        process.exit(1);

      return;
    }

    console.log();
    if (analysis.containsTypes) {
      await tabular.typed(analysis, opts);

      if (
        analysis.containsTypes &&
        !!core.getProblems(analysis).filter((problem) => !opts.ignore.includes(problem.kind)).length
      )
        process.exit(1);
    } else {
      tabular.untyped(analysis as core.UntypedAnalysis);
    }
  });

if (process.argv.length <= 2) {
  program.outputHelp();
  console.log();
}

program.parse(process.argv);

function handleError(error: unknown, title: string): never {
  if (error && typeof error === "object" && "message" in error) {
    program.error(`error while ${title}:\n${error.message}`, {
      code: "code" in error && typeof error.code === "string" ? error.code : "UNKNOWN",
    });
  }

  program.error(`unknown error while ${title}`, { code: "UNKNOWN" });
}
