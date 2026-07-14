import assert from "node:assert";
import { test } from "node:test";
import { getInternalResolutionDiagnostic } from "@arethetypeswrong/core/utils";

test("getInternalResolutionDiagnostic extracts conditions and the resolver message", () => {
  assert.deepStrictEqual(
    getInternalResolutionDiagnostic(
      [
        "Resolving in ESM mode with conditions 'import', 'types', 'node'.",
        "File '/node_modules/pkg/missing.d.ts' does not exist.",
        "======== Module name './missing' was not resolved. ========",
      ],
      "node16",
      "esm",
    ),
    {
      conditions: ["import", "types", "node"],
      resolverMessage: "Module name './missing' was not resolved.",
    },
  );
});

test("getInternalResolutionDiagnostic falls back without emitting an empty cause", () => {
  assert.deepStrictEqual(getInternalResolutionDiagnostic([], "bundler", "cjs"), {
    conditions: ["import", "types"],
  });
  assert.deepStrictEqual(getInternalResolutionDiagnostic([], "node10", "cjs"), {});
  assert.deepStrictEqual(
    getInternalResolutionDiagnostic(
      ["Resolving in CJS mode with conditions 'require', 'types', 'node'."],
      "node16",
      "cjs",
    ),
    { conditions: ["require", "types", "node"] },
  );
});
