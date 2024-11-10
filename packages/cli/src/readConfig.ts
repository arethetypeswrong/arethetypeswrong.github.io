import { Command } from "commander";
import { readFile } from "fs/promises";
import { problemFlags } from "./problemUtils.js";
import { profiles } from "./profiles.js";

export async function readConfig(program: Command, alternate = ".attw.json") {
  try {
    const results = await readFile(alternate, "utf8");
    if (!results) return;

    const opts = JSON.parse(results);
    for (let key in opts) {
      if (key === "configPath")
        program.error(`cannot set "configPath" within ${alternate}`, { code: "INVALID_OPTION" });

      const value = opts[key];

      if (key === "ignoreRules") {
        if (!Array.isArray(value)) program.error(`error: config option 'ignoreRules' should be an array.`);
        const invalid = value.find((rule) => !Object.values(problemFlags).includes(rule));
        if (invalid)
          program.error(
            `error: config option 'ignoreRules' argument '${invalid}' is invalid. Allowed choices are ${Object.values(
              problemFlags,
            ).join(", ")}.`,
          );
      }

      if (key === "profile") {
        if (typeof value !== "string") program.error(`error: config option 'profile' should be a string.`);
        if (!(value in profiles))
          program.error(
            `error: config option 'profile' argument '${value}' is invalid. Allowed choices are ${Object.keys(
              profiles,
            ).join(", ")}.`,
          );
      }

      if (Array.isArray(value)) {
        const opt = program.getOptionValue(key);

        if (Array.isArray(opt)) {
          program.setOptionValueWithSource(key, [...opt, ...value], "config");

          continue;
        }
      }

      if (key !== "help" && key !== "version") program.setOptionValueWithSource(key, opts[key], "config");
    }
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || !("message" in error)) {
      program.error("unknown error while reading config file", { code: "UNKNOWN" });
    } else if (error.code !== "ENOENT") {
      program.error(`error while reading config file:\n${error.message}`);
    }
  }
}
