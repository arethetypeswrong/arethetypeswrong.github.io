# 💀 Resolution failed

Import failed to resolve to type declarations or JavaScript files.

## Explanation

This problem indicates that TypeScript can’t find any file with a supported file extension (`.js`, `.mjs`, `.cjs`, `.jsx`, `.json`, `.ts`, `.mts`, `.cts`, `.tsx`) by following its own resolution algorithm, or a modified version of its resolution algorithm that ignores type declaration (`.d.ts`, `.d.mts`, `.d.cts`, `.d.*.ts`) files (which allows it to find JS files it would otherwise ignore).

## Consequnces

* Consumers will see TypeScript errors on imports/requires.
* If the diagnosis is accurate, a runtime/bundle-time error will occur.

## Common causes

### False positive: unsupported file extension

TypeScript doesn’t record non-JS/TS files as resolution results, and its API can’t be used to distinguish between a result with an unsupported file extension and a non-existent file. If a package.json subpath exposes a non-JS asset like a `.css` file, designed to be processed by a bundler or runtime extension, this will show up as a failed resolution, when it might be more accurately described as an [untyped resolution](./UntypedResolution.md) of an unknown file type.

If the asset is intended to be imported as a side-effect import (`import "pkg/styles.css"`), this problem can safely be ignored.

### True positive: Node 10 doesn’t support package.json `"exports"`

When this problem occurs for the `node10` resolution option but not any others, it usually means that the package uses package.json `"exports"` to map a subpath into a `dist` folder:

```json
{
  "name": "pkg",
  "main": "./dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./subpath": "./dist/subpath.js"
  }
}
```

In this example, an import of `"pkg/subpath"` can be used in Node 12+ and modern bundlers, but would fail to resolve in Node 10. Accordingly, TypeScript’s `--moduleResolution node10` (also confusingly known as `node`, because history) does not resolve `"exports"` either.

While few libraries care about supporting a long-past EOL version of Node, maintainers of very popular libraries should be aware that many TypeScript users are still using `--moduleResolution node`. If they aren’t literally using Node 10, they really should move away from it, but sometimes migrating can be difficult because it introduces new errors caused by _incorrect dependency typings_—the problem this tool was made to diagnose. Popular libraries often choose to adopt a strategy that allows `--moduleResolution node10` to work even without `"exports"` support. https://github.com/andrewbranch/example-subpath-exports-ts-compat demonstrates several such strategies.
