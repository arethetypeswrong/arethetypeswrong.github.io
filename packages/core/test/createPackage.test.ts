import assert from "node:assert";
import { describe, test } from "node:test";
import { checkPackage, Package } from "@arethetypeswrong/core";

describe("Package", () => {
  test("ignores native addons without affecting package analysis", async () => {
    const packageRoot = "/node_modules/test";
    const files = {
      [`${packageRoot}/package.json`]: JSON.stringify({
        name: "test",
        version: "1.0.0",
        main: "index.js",
        types: "index.d.ts",
      }),
      [`${packageRoot}/index.js`]: "exports.answer = 42;",
      [`${packageRoot}/index.d.ts`]: "export declare const answer: number;",
      [`${packageRoot}/loader.node.js`]: "export const loadsNativeAddon = true;",
    };
    const packageWithoutNativeAddon = new Package(files, "test", "1.0.0");
    const packageWithNativeAddon = new Package(
      {
        ...files,
        [`${packageRoot}/build/Release/addon.node`]: new Uint8Array([0, 1, 2, 3]),
      },
      "test",
      "1.0.0",
    );

    assert.strictEqual(packageWithNativeAddon.fileExists(`${packageRoot}/build/Release/addon.node`), false);
    assert.deepStrictEqual(packageWithNativeAddon.listFiles(), packageWithoutNativeAddon.listFiles());
    for (const path of Object.keys(files)) {
      assert.strictEqual(packageWithNativeAddon.readFile(path), packageWithoutNativeAddon.readFile(path));
    }
    assert.deepStrictEqual(await checkPackage(packageWithNativeAddon), await checkPackage(packageWithoutNativeAddon));
  });
});
