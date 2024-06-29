import { readFile } from "fs/promises";
import path from "path";

/** Determine which CLI command to use to create a tarball from a package. */
export const determinePackCommand = (packageManager: string, filename?: string) => {
  switch (packageManager) {
    case "pnpm":
      // PNPM does not support custom destination filenames (see: https://github.com/pnpm/pnpm/issues/7834)
      return "pnpm pack";
    case "yarn":
      return filename ? `yarn pack --out ${filename}` : "yarn pack";
    default:
      return filename ? `npm pack ${filename}` : "npm pack";
  }
};

/** Determine which tarball filename to use. */
export const determineTarballFilename = async (fileOrDirectory: string) => {
  const manifest = JSON.parse(await readFile(path.join(fileOrDirectory, "package.json"), { encoding: "utf8" }));

  return path.join(
    fileOrDirectory,
    // https://github.com/npm/cli/blob/f875caa86900122819311dd77cde01c700fd1817/lib/utils/tar.js#L123-L125
    `${manifest.name.replace("@", "").replace("/", "-")}-${manifest.version}.tgz`,
  );
};
