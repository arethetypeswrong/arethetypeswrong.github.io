import { getProbableExports } from "#internal/getProbableExports";
import assert from "node:assert";
import { describe, test } from "node:test";
import ts from "typescript";

const testCases = {
  tgwf__co2: {
    expected: ["averageIntensity", "co2", "default", "hosting", "marginalIntensity"],
    file: `var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  averageIntensity: () => import_average_intensities_min.default,
  co2: () => import_co2.default,
  default: () => src_default,
  hosting: () => import_hosting.default,
  marginalIntensity: () => import_marginal_intensities_2021_min.default
});
module.exports = __toCommonJS(src_exports);
var import_co2 = __toESM(require("./co2.js"));
var import_hosting = __toESM(require("./hosting.js"));
var import_average_intensities_min = __toESM(require("./data/average-intensities.min.js"));
var import_marginal_intensities_2021_min = __toESM(require("./data/marginal-intensities-2021.min.js"));
var src_default = { co2: import_co2.default, hosting: import_hosting.default, averageIntensity: import_average_intensities_min.default, marginalIntensity: import_marginal_intensities_2021_min.default };
//# sourceMappingURL=index.js.map`,
  },

  minified: {
    expected: ["App", "log"],
    file: `var m=Object.create;var n=Object.defineProperty;var c=Object.getOwnPropertyDescriptor;var x=Object.getOwnPropertyNames;var a=Object.getPrototypeOf,g=Object.prototype.hasOwnProperty;var s=(o,r)=>()=>(r||o((r={exports:{}}).exports,r),r.exports),b=(o,r)=>{for(var e in r)n(o,e,{get:r[e],enumerable:!0})},i=(o,r,e,p)=>{if(r&&typeof r=="object"||typeof r=="function")for(let t of x(r))!g.call(o,t)&&t!==e&&n(o,t,{get:()=>r[t],enumerable:!(p=c(r,t))||p.enumerable});return o};var w=(o,r,e)=>(e=o!=null?m(a(o)):{},i(r||!o||!o.__esModule?n(e,"default",{value:o,enumerable:!0}):e,o)),F=o=>i(n({},"__esModule",{value:!0}),o);var d=s((h,u)=>{var q=require("fs");u.exports=o=>{q.appendFileSync("/log.txt",o)}});var H={};b(H,{App:()=>y,log:()=>A});module.exports=F(H);function l(o,r){return o+r}var f=w(d());function y(){return React.createElement("p",null,"Hello, world! ",l(1,2))}function A(){(0,f.default)("woo")}`,
  },

  bbob__parser: {
    expected: ["TagNode", "default", "parse"],
    file: `
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    TagNode: function() {
        return _pluginHelper.TagNode;
    },
    default: function() {
        return _parse.default;
    },
    parse: function() {
        return _parse.parse;
    }
});
var _pluginHelper = require("@bbob/plugin-helper");
var _parse = /*#__PURE__*/ _interopRequireWildcard(require("./parse"));`,
  },
};

describe("getProbableExports", () => {
  Object.entries(testCases).forEach(([name, { expected, file }]) => {
    test(name, () => {
      const sourceFile = ts.createSourceFile("test.js", file, ts.ScriptTarget.ESNext, true);
      ts.bindSourceFile(sourceFile, {
        target: ts.ScriptTarget.Latest,
        allowJs: true,
        checkJs: true,
      });
      const result = getProbableExports(sourceFile);
      assert.deepStrictEqual(result?.map((r) => r.name), expected);
    });
  });
});
