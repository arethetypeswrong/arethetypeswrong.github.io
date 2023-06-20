# 👺 Masquerading as ESM

Import resolved to an ESM type declaration file, but a CommonJS JavaScript file.

Note: this problem is the same as [“Masquerading as CJS”](./FalseCJS.md), but the module formats of the type declaration file and implementation JavaScript file are reversed. The explanation is essentially the same, but the consequences are different.

## Explanation

In Node, files are determined to be ES modules or CommonJS modules by their file extension and ancestor package.json `"type"` field. When in `--moduleResolution node16`, TypeScript uses the same algorithm to determine the module format of type declaration files. A `.d.mts` file represents a `.mjs` file which is always an ES module; a `.d.cts` file represents a `.cjs` file which is always a CommonJS module; a `.d.ts` file represents a `.js` file whose module format is determined by the nearest package.json.

When a user writes an import, TypeScript needs to know whether the resolved module is ESM or CJS in order to provide accurate checking. It makes this determination based on the file extension and package.json `"type"` of the _type declaration file_ it finds. This logic depends on an assumption that the type declaration file resolved by TypeScript and the JavaScript file resolved by Node actually match—an assumption that necessarily holds if the pair is generated by `tsc`, but can be easily violated with hand-authored declaration files or third-party build tools.

This problem indicates a violation of that assumption where the type declaration file implies that the corresponding runtime module is an ES module, but it appears that Node will resolve to a CommonJS module.

This problem is only raised when checking entrypoints under `--moduleResolution node16`, as that’s currently the only TypeScript mode that makes a module format distinction based on file extension and package.json.

## Consequences

TypeScript will not allow consumers in CommonJS files to import/require the module without using `await import("pkg")`, even though that won’t actually be needed at runtime. In Node, an ES module cannot be accessed with `require`, so TypeScript will report this as an error at compile time. Note that in CommonJS TypeScript files (`.cts`, `.ts` with no package.json `"type": "module"`), top-level import declarations are emitted as `require` variable declarations (since CommonJS files cannot use `import`/`export` in Node), so this problem can occur even when the consumer is using `import` syntax:

```ts
import mod from "pkg";
//              ^^^^^
// The current file is a CommonJS module whose imports will produce 'require'
// calls; however, the referenced file is an ECMAScript module and cannot be
// imported with 'require'. Consider writing a dynamic 'import("pkg")' call
// instead.
```

## Common causes

This problem usually happens when a library that includes both a CJS and ESM implementation attempts to use a single `.d.ts` file to represent both, where the package.json has `"type": "module"`, most often in a structure like:

```json
{
  "name": "pkg",
  "type": "module",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "import": "./index.js",
      "require": "./index.cjs"
    }
  }
}
```

The `types` condition is always set by TypeScript, so the `index.d.ts` file will be resolved regardless of whether `import` or `require` is set. When `require` is set, the runtime will resolve to `index.cjs`, which is a CommonJS module. But `index.d.ts`, due to its file extension, is interpreted as representing an ES module. (The execution of `tsc --declaration` that produces an `index.d.ts` would also produce an `index.js` counterpart, and `.js` files are ESM in this location because the package.json contains `"type": "module"`.)

A golden rule of declaration files is that if they represent a module—that is, if they use `import` or `export` at the top level—they must represent _exactly_ one JavaScript file. They _especially_ cannot represent JavaScript files of two different module formats. The example above needs to add a `.d.cts` file to represent the `.cjs` file, at which point the package.json can be rewritten as:

```json
{
  "name": "pkg",
  "type": "module",
  "exports": {
    ".": {
      "import": {
        "types": "./index.d.ts",
        "default": "./index.js"
      },
      "require": {
        "types": "./index.d.cts",
        "default": "./index.cjs"
      }
    }
  }
}
```

or just as well:

```json
{
  "name": "pkg",
  "type": "module",
  "exports": {
    ".": {
      "import": "./index.js",
      "require": "./index.cjs"
    }
  }
}
```

letting TypeScript find the corresponding `index.d.ts` and `index.d.cts` files by extension substitution.

Whatever tool produces the `index.cjs` file should ideally take responsibility for producing the `index.d.cts` file, and likewise for the `.js`/`.d.ts` pair.