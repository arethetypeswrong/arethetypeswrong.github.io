import { Package } from "../../createPackage.js";
import { getEsmModuleBindings } from "./esmBindings.js";
import { esmResolve } from "./esmResolve.js";
import { getCjsModuleNamespace } from "./cjsNamespace.js";

// Note: this doesn't handle ambiguous indirect exports which probably isn't worth the
// implementation complexity.

export function getEsmModuleNamespace(
  fs: Package,
  specifier: string,
  parentURL = new URL("file:///"),
  seen = new Set<string>(),
): string[] {
  // Resolve specifier
  const { format, resolved } = esmResolve(fs, specifier, parentURL);

  // Don't recurse for circular indirect exports
  if (seen.has(resolved.pathname)) {
    return [];
  }
  seen.add(resolved.pathname);

  if (format === "commonjs") {
    return [...getCjsModuleNamespace(fs, resolved)];
  }

  // Parse module bindings
  const bindings =
    (format ?? "module") === "module"
      ? getEsmModuleBindings(fs.readFile(resolved.pathname))
      : // Maybe JSON, WASM, etc
        { exports: ["default"], reexports: [] };

  // Concat indirect exports
  const indirect = bindings.reexports
    .flatMap((specifier) => getEsmModuleNamespace(fs, specifier, resolved, seen))
    .filter((name) => name !== "default");
  return [...new Set([...bindings.exports, ...indirect])];
}
