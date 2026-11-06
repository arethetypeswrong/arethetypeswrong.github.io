import { getExitCode } from "@arethetypeswrong/cli/internal/getExitCode";
import { checkPackage, Package } from "@arethetypeswrong/core";
import { problemAffectsResolutionKind } from "@arethetypeswrong/core/problems";
import { allResolutionKinds } from "@arethetypeswrong/core/utils";
import assert from "node:assert";
import { describe, test } from "node:test";

function createPackage(files: Record<string, string>) {
  return new Package(
    Object.fromEntries(Object.entries(files).map(([name, content]) => [`/node_modules/test/${name}`, content])),
    "test",
    "1.0.0",
  );
}

function problemKinds(analysis: Awaited<ReturnType<typeof checkPackage>>) {
  return analysis.types ? analysis.problems.map((problem) => problem.kind).sort() : [];
}

// Node 10 reaches dist/index.d.ts through `types` and cannot resolve its `#lib/*` import.
const internalResolutionError = createPackage({
  "package.json": JSON.stringify({
    name: "test",
    version: "1.0.0",
    type: "module",
    main: "./dist/index.js",
    types: "./dist/index.d.ts",
    exports: { ".": { types: "./dist/index.d.ts", default: "./dist/index.js" } },
    imports: { "#lib/*": "./dist/lib/*" },
  }),
  "dist/index.d.ts": `export { x } from "#lib/util.js";`,
  "dist/index.js": `export { x } from "#lib/util.js";`,
  "dist/lib/util.d.ts": `export declare const x: number;`,
  "dist/lib/util.js": `export const x = 1;`,
});

// The require condition pairs CommonJS types with an ES module.
const falseCjs = createPackage({
  "package.json": JSON.stringify({
    name: "test",
    version: "1.0.0",
    exports: {
      ".": {
        import: { types: "./index.d.mts", default: "./index.mjs" },
        require: { types: "./index.d.ts", default: "./index.mjs" },
      },
    },
  }),
  "index.d.mts": `export declare const x: number;`,
  "index.d.ts": `export declare const x: number;`,
  "index.mjs": `export const x = 1;`,
});

// The declaration has only a default export and the JavaScript also assigns module.exports, in every resolution.
const missingExportEquals = createPackage({
  "package.json": JSON.stringify({ name: "test", version: "1.0.0", main: "./index.js" }),
  "index.d.ts": `declare function f(): void;\nexport default f;`,
  "index.js": `function f() {}\nmodule.exports = f;\nmodule.exports.default = f;`,
});

describe("getExitCode", () => {
  test("ignores an InternalResolutionError visible only under ignored resolutions", async () => {
    const analysis = await checkPackage(internalResolutionError);
    assert.deepStrictEqual(problemKinds(analysis), ["CJSResolvesToESM", "InternalResolutionError"]);
    assert.strictEqual(getExitCode(analysis, { ignoreResolutions: ["node10", "node16-cjs"] }), 0);
    assert.strictEqual(getExitCode(analysis, { ignoreResolutions: ["node16-cjs"] }), 1);
    assert.strictEqual(getExitCode(analysis), 1);
  });

  test("ignores a FalseCJS visible only under ignored resolutions", async () => {
    const analysis = await checkPackage(falseCjs);
    assert.deepStrictEqual(problemKinds(analysis), ["CJSResolvesToESM", "FalseCJS"]);
    assert.strictEqual(getExitCode(analysis, { ignoreResolutions: ["node10", "node16-cjs"] }), 0);
    assert.strictEqual(getExitCode(analysis), 1);
    assert.strictEqual(
      getExitCode(analysis, { ignoreResolutions: ["node10"], ignoreRules: ["cjs-resolves-to-esm"] }),
      1,
    );
  });

  test("counts a problem visible in both ignored and required resolutions", async () => {
    const analysis = await checkPackage(missingExportEquals);
    assert.deepStrictEqual(problemKinds(analysis), ["MissingExportEquals"]);
    assert(analysis.types);
    const [problem] = analysis.problems;
    assert.deepStrictEqual(
      allResolutionKinds.filter((kind) => problemAffectsResolutionKind(problem!, kind, analysis)),
      allResolutionKinds,
    );
    assert.strictEqual(getExitCode(analysis, { ignoreResolutions: ["node10", "node16-cjs"] }), 1);
    assert.strictEqual(getExitCode(analysis, { ignoreResolutions: ["node10", "node16-cjs", "node16-esm"] }), 1);
    assert.strictEqual(getExitCode(analysis, { ignoreResolutions: allResolutionKinds }), 0);
  });

  test("still applies ignored rules to required resolutions", async () => {
    const analysis = await checkPackage(internalResolutionError);
    assert.strictEqual(
      getExitCode(analysis, { ignoreResolutions: ["node16-cjs"], ignoreRules: ["internal-resolution-error"] }),
      0,
    );
  });
});
