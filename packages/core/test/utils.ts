import path from "node:path";
import { Package } from "@arethetypeswrong/core";
import assert from "node:assert";

export function createTestPackage(
  files: Record<string, string>,
  packageName = "test",
  packageVersion = "1.0.0",
): Package {
  const pkg = new Package(
    Object.fromEntries(
      Object.entries(files).map(([name, content]) => {
        if (path.isAbsolute(name)) {
          assert(name.startsWith(`/node_modules/${packageName}/`));
          return [name, content];
        }
        return [path.join(`/node_modules/${packageName}`, name), content];
      }),
    ),
    packageName,
    packageVersion,
  );

  assert(pkg.fileExists(`/node_modules/${packageName}/package.json`), "Must contain package.json");
  return pkg;
}
