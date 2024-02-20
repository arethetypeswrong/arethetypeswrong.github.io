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

  test("basic MissingExportEquals (babel-plugin-syntax-jsx)", () => {
    assert(
      isMissingExportEquals(
        `declare function jsx(): {
          manipulateOptions(opts: any, parserOpts: { plugins: string[] }): void;
        };
        export default jsx;`,
        `"use strict";
        exports.__esModule = true;
        exports.default = function () {
          return {
            manipulateOptions: function manipulateOptions(opts, parserOpts) {
              parserOpts.plugins.push("jsx");
            }
          };
        };
        module.exports = exports["default"];`,
      ),
    );
  });

  test("implementation default export is any, assigned to module.exports", () => {
    assert(
      isMissingExportEquals(
        `export default function ms(): any`,
        `'use strict';
        Object.defineProperty(exports, "__esModule", {
          value: true
        });
        var _babelPluginMacros = require('babel-plugin-macros');
        var _ms = require('ms');
        var _ms2 = _interopRequireDefault(_ms);
        function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
        const getValue = path => {
          if (path.type === 'CallExpression') {
            return path.node.arguments[0].value;
          }
          if (path.type === 'TaggedTemplateExpression') {
            return path.node.quasi.quasis[0].value.cooked;
          }
          return null;
        };
        exports.default = (0, _babelPluginMacros.createMacro)(({ babel: { types: t }, references: { default: paths } }) => {
          paths.forEach(({ parentPath }) => {
            const value = getValue(parentPath);
            if (value) {
              const newValue = (0, _ms2.default)(value);
              if (newValue) {
                parentPath.replaceWith(t.numericLiteral(newValue));
              } else {
                const line = parentPath.node.loc.start.line;
        
                throw new _babelPluginMacros.MacroError();
              }
            }
          });
        });
        module.exports = exports['default'];`,
      ),
    );
  });

  test("lone deafult export is primitive", () => {
    assert(
      isOk(
        `declare const _default: string;
        export default _default;`,
        `exports.default = "hello";
        exports.OtherThing = 1;`,
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

  test("exports merged with a class, copied to default", () => {
    assert(
      isMissingExportEquals(
        `declare class Ajv {}
        export declare class CustomError extends Error {}
        export default Ajv;`,
        `class Ajv {}
        module.exports = exports = Ajv;
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.default = Ajv;
        class CustomError extends Error {}
        Object.defineProperty(exports, "CustomError", { enumerable: true, get: function () { return CustomError; } });`,
      ),
    );
  });

  test("exports merged with a class, no default", () => {
    assert(
      isFalseExportDefault(
        `declare class Ajv {}
        export declare class CustomError extends Error {}
        export default Ajv;`,
        `class Ajv {}
        module.exports = exports = Ajv;
        class CustomError extends Error {}
        Object.defineProperty(exports, "CustomError", { enumerable: true, get: function () { return CustomError; } });`,
      ),
    );
  });

  test("ignores unalayzable iife", () => {
    assert(
      isOk(
        `export default function foo(): void`,
        `!(function (e, i) {
          "use strict";
          var Ue = require("pako");
          e.Apptimize = function () {};
        })(
          "undefined" != typeof exports ? exports : "undefined" != typeof window ? window : this,
          "undefined" != typeof exports ? exports : "undefined" != typeof window ? window : this
          );`,
      ),
    );
  });

  test("types have single default export, JS has default and other named exports", () => {
    assert(
      isOk(
        `export default function foo(): void`,
        `function foo() {}
        exports.default = foo;
        exports.bar = 1;`,
      ),
    );
  });

  test("module.exports.default = module.exports (radium)", () => {
    assert(
      isMissingExportEquals(
        `declare function Radum(): any;
        export default Radum;`,
        `module.exports = require('./lib').default;
        module.exports.default = module.exports;`,
      ),
    );
  });
});
