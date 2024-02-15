import check from "#internal/checks/exportDefaultDisagreement.js";
import type { CheckExecutionContext } from "#internal/defineCheck.js";
import { getEntrypointInfo } from "#internal/getEntrypointInfo.js";
import { createCompilerHosts } from "#internal/multiCompilerHost.js";
import test, { describe } from "node:test";
import { createTestPackage } from "../utils.js";
import assert from "node:assert";

function runCheck(ts: string, js: string) {
  const pkg = createTestPackage({
    "index.d.ts": ts,
    "index.js": js,
    "package.json": JSON.stringify({ main: "index.js" }),
  });
  const hosts = createCompilerHosts(pkg);
  const context: CheckExecutionContext = {
    entrypoints: getEntrypointInfo(pkg.packageName, pkg, hosts, undefined),
    hosts,
    pkg,
    programInfo: {
      node10: {},
      node16: {},
      bundler: {},
    },
  };
  return check.execute(
    [`/node_modules/${pkg.packageName}/index.d.ts`, `/node_modules/${pkg.packageName}/index.js`],
    context,
  );
}

function isOk(ts: string, js: string) {
  return !runCheck(ts, js);
}
function isFalseExportDefault(ts: string, js: string) {
  const res = runCheck(ts, js);
  return res && !Array.isArray(res) && res.kind === "FalseExportDefault";
}
function isMissingExportEquals(ts: string, js: string) {
  const res = runCheck(ts, js);
  return res && !Array.isArray(res) && res.kind === "MissingExportEquals";
}

describe("exportDefaultDisagreement", () => {
  test("basic FalseExportDefault", () => {
    assert(isFalseExportDefault(`export default function foo(): void`, `module.exports = `));
  });
  test("basic MissingExportEquals", () => {
    assert(
      isMissingExportEquals(
        `export default function foo(): void`,
        `function foo() {}
        module.exports = foo;
        module.exports.default = foo;`,
      ),
    );
  });
  test("class with static default property", () => {
    assert(
      isOk(
        `declare class Foo {
          static default: typeof Foo;
        }
        export = Foo`,
        `class Foo {}
        Foo.default = Foo;
        module.exports = Foo;`,
      ),
    );
  });
  test("named exports = module.exports - esbuild", () => {
    assert(
      isOk(
        `export declare const a: string;
        export declare const b: string;
        declare const _default: { a: string, b: string };
        export default _default;`,
        `var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.tsx
var index_exports = {};
__export(index_exports, {
  a: () => a,
  b: () => b,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var a = "a";
var b = "b";
var index_default = { a, b };`,
      ),
    );
  });
});
