# 🐛 Used fallback condition

Import resolved to types through a conditional package.json export, but only after failing to resolve through an earlier condition. This behavior is a [TypeScript bug](https://github.com/microsoft/TypeScript/issues/50762). It may misrepresent the runtime behavior of this import and should not be relied upon.

## Explanation

[Node’s algorithm](https://nodejs.org/docs/latest-v20.x/api/esm.html#resolution-algorithm-specification) for resolving package.json `"exports"` requires that resolution stop once a target filename has been tried, whether or not that file could be found. For example, consider resolving an import with conditions `types` and `import` against these `exports`:

```json
{
  "exports": {
    ".": {
      "types": {
        "foo": "./didnt-match.d.ts"
      },
      "import": {
        "types": "./doesnt-exist.d.ts",
        "default": "./exists.mjs"
      }
    }
  }
}
```

To simplify the specification, resolution _should_ proceed as follows:

1. Enter the first `"types"` condition because it matches.
2. Does `"foo"` match? No. Since we haven’t tried to look up a file yet, we can exit `"types"` and continue.
3. Enter the `"import"` condition because it matches.
4. Try to look up `"./doesnt-exist.d.ts"` because `"types"` matches.
5. Fail to find a file at `"./doesnt-exist.d.ts"`, so return a failed resolution result.

TypeScript reimplements this algorithm so it can understand what Node will do and find corresponding types for a given resolution, but TypeScript’s implementation has a known bug. Instead of returning a failed resolution when it can’t find `doesnt-exist.d.ts`, it continues to the next matching condition. In the example above, TypeScript would successfully resolve to `exists.mjs`.

This problem is raised when a resolution occurred only because of this TypeScript bug.

## Consequences

This problem almost always indicates the presence of another (deeper) problem, since a correct resolver implementation would have resulted in a [failed resolution](./NoResolution.md) or an [untyped resolution](./UntypedResolution.md), which themselves are almost always caused by a misconfiguration of the library. Often, the incorrect resolution results in a better experience for the user than a failed resolution would, which makes it difficult for TypeScript to fix the bug. The TypeScript team would want to see occurrences of this issue drop to negligible levels before fixing their resolver algorithm.

## Common causes

This issue commonly occurs in combination with [“Masquerading as CJS”](./FalseCJS.md) or [“Masquerading as ESM”](./FalseESM.md) through a package.json like:

```json
{
  "name": "pkg",
  "main": "./index.js",
  "types": "./index.d.ts",
  "exports": {
    "import": "./index.mjs",
    "default": "./index.js"
  }
}
```

where an `index.d.ts` exists but `index.d.mts` does not. TypeScript first does a resolution pass only looking for types and ignoring JavaScript files, so when resolving with the `import` condition, that first pass goes something like:

1. `"import"` matches, so try substituting the `.mjs` extension for the type-equivalent `.d.mts`. `index.d.mts` does not exist, so **continue** (this is the bug).
2. `"default"` conditions always match, so try substituting the `.js` extension for the type-equivalent `.d.ts`. `index.d.ts` exists, so us that as a resolution result.

But in this example, `index.d.ts` is a CommonJS module since the package.json lacks a `"type": "module"` field, whereas the runtime resolution would have been `index.mjs`, which is an ES module. So, an instance of [“Masquerading as CJS”](./FalseCJS.md) also occurred. If the library adds an `index.d.mts` file to represent the `index.mjs` file, both problems will be solved simultaneously.
