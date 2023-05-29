import { Command } from "commander";
import { readFile } from "fs/promises";

export async function readConfig(program: Command, alternate = ".attw.json") {
  try {
    const results = await readFile(alternate, "utf8");
    const opts = JSON.parse(results);
    for (let key in opts) {
      if (key === "configPath")
        program.error(`cannot set "configPath" within ${alternate}`, { code: "INVALID_OPTION" });
      program.setOptionValueWithSource(key, opts[key], "config");
    }
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || !("message" in error)) {
      program.error("unknown error while reading config file", { code: "UNKNOWN" });
    } else if (error.code !== "ENOENT") {
      program.error(`error while reading config file:\n${error.message}`);
    }
  }
}
