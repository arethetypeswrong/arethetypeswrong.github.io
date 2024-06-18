import { getEsmModuleBindings } from "#internal/esm/esmBindings.js";
import assert from "node:assert";
import { describe, test } from "node:test";

describe("getEsmModuleBindings", () => {
  test("correctness", () => {
    const body = `export default null;
    export const declaration = null;
    export const [
      arrayBinding = null,
      ...arrayRest
    ] = null;
    export const {
      objectBinding = null,
      objectBinding: objectRebinding,
      ...objectSpread
    } = null;
    const named = null;
    export { named, named as renamed, named as "renamed string" };
    export class classDeclaration {}
    export function functionDeclaration() {}

    export * as namespace from 'specifier';
    export * from 'specifier';
    `;
    const expected = {
      exports: [
        "default",
        "declaration",
        "arrayBinding",
        "arrayRest",
        "objectBinding",
        "objectRebinding",
        "objectSpread",
        "named",
        "renamed",
        "renamed string",
        "classDeclaration",
        "functionDeclaration",
        "namespace",
      ],
      reexports: ["specifier"],
    };
    assert.deepStrictEqual(getEsmModuleBindings(body), expected);
  });
});
