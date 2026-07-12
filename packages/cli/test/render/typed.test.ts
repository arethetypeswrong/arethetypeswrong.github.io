import assert from "node:assert";
import { test } from "node:test";
import type {
  Analysis,
  EntrypointResolutionAnalysis,
  InternalResolutionErrorProblem,
  ResolutionKind,
} from "@arethetypeswrong/core";
import { typed } from "@arethetypeswrong/cli/internal/render";

type StructuredInternalResolutionErrorProblem = InternalResolutionErrorProblem & {
  entrypoint: string;
  resolutionKind: ResolutionKind;
  resolutionModeName: "esm" | "cjs";
  conditions?: string[];
  resolverMessage?: string;
};

const trace = [
  "Resolving in ESM mode with conditions 'import', 'types', 'node'.",
  "======== Module name './missing' was not resolved. ========",
];

const problem: StructuredInternalResolutionErrorProblem = {
  kind: "InternalResolutionError",
  entrypoint: ".",
  resolutionKind: "node16-esm",
  resolutionOption: "node16",
  resolutionMode: 99 as InternalResolutionErrorProblem["resolutionMode"],
  resolutionModeName: "esm",
  fileName: "/node_modules/fixture/index.d.mts",
  moduleSpecifier: "./missing",
  conditions: ["import", "types", "node"],
  resolverMessage: "Module name './missing' was not resolved.",
  pos: 0,
  end: 11,
  trace,
};

function resolution(resolutionKind: ResolutionKind, visibleProblems?: number[]): EntrypointResolutionAnalysis {
  return {
    name: "fixture",
    resolutionKind,
    visibleProblems,
  };
}

function analysis(problems: Analysis["problems"] = [problem]): Analysis {
  return {
    packageName: "fixture",
    packageVersion: "1.0.0",
    buildTools: {},
    types: { kind: "included" },
    entrypoints: {
      ".": {
        subpath: ".",
        hasTypes: true,
        isWildcard: false,
        resolutions: {
          node10: resolution("node10"),
          "node16-cjs": resolution("node16-cjs"),
          "node16-esm": resolution("node16-esm", problems.length ? [0] : undefined),
          bundler: resolution("bundler"),
        },
      },
    },
    programInfo: {
      node10: {},
      node16: { moduleKinds: {} },
      bundler: {},
    },
    problems,
  };
}

test("typed renders actionable internal resolution diagnostics and verbose traces", async () => {
  const concise = await typed(analysis(), { emoji: false, format: "ascii" });
  assert.match(
    concise,
    /'\.\/missing' failed to resolve for entrypoint 'fixture' using node16-esm with conditions 'import', 'types', 'node' from declaration '\/node_modules\/fixture\/index\.d\.mts': Module name '\.\/missing' was not resolved\./,
  );
  assert.doesNotMatch(concise, /Use -f json/);

  const verbose = await typed(analysis(), {
    emoji: false,
    format: "ascii",
    verbose: true,
  });
  assert.match(verbose, /Internal resolution trace for '\.\/missing'/);
  for (const line of trace) {
    assert.ok(verbose.includes(line));
  }
});

test("typed keeps table cells concise when summary is disabled", async () => {
  const output = await typed(analysis(), {
    emoji: false,
    format: "ascii",
    summary: false,
  });
  assert.match(output, /Internal resolution error: '\.\/missing'/);
  assert.doesNotMatch(output, /with conditions 'import', 'types', 'node'/);
  assert.doesNotMatch(output, /from declaration '\/node_modules\/fixture\/index\.d\.mts'/);
});

test("typed accepts verbose mode without internal resolution errors", async () => {
  const output = await typed(analysis([]), {
    emoji: false,
    format: "ascii",
    verbose: true,
  });
  assert.doesNotMatch(output, /Internal resolution trace/);
});

test("typed omits unavailable diagnostic parts for an unusual declaration path", async () => {
  const incompleteProblem: StructuredInternalResolutionErrorProblem = {
    ...problem,
    fileName: "/",
    conditions: undefined,
    resolverMessage: undefined,
    trace: [],
  };
  const output = await typed(analysis([incompleteProblem]), {
    emoji: false,
    format: "ascii",
    verbose: true,
  });
  assert.match(output, /from declaration '\/'/);
  assert.doesNotMatch(output, /undefined|Internal resolution trace/);
});
