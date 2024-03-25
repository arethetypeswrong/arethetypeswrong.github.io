import { Package } from "../../createPackage.js";
import { getCjsModuleBindings } from "./cjsBindings.js";
import { cjsResolve } from "./cjsResolve.js";

export function getCjsModuleNamespace(fs: Package, file: URL, seen = new Set<string>()) {
  seen.add(file.pathname);
  const { exports, reexports } = getCjsModuleBindings(fs.readFile(file.pathname));

  // CJS always exports `default`
  if (!exports.includes("default")) {
    exports.push("default");
  }

  // Additionally, resolve facade reexports
  const lastResolvableReexport = (() => {
    for (const source of reexports.reverse()) {
      try {
        return cjsResolve(fs, source, file);
      } catch {}
    }
  })();
  if (
    lastResolvableReexport &&
    lastResolvableReexport.format === "commonjs" &&
    !seen.has(lastResolvableReexport.resolved.pathname)
  ) {
    const extra = getCjsModuleNamespace(fs, lastResolvableReexport.resolved, seen);
    exports.push(...extra.filter((name) => !exports.includes(name)));
  }

  return exports;
}
