# ❌ No types

Import resolved to JavaScript files, but no type declarations were found.

## Explanation

This problem indicates that TypeScript’s resolution algorithm discovered a JS file, but couldn’t find a corresponding type declaration file. By default, TypeScript does not analyze JS files within node_modules to provide type information for imports.

Note that this tool does not show results unless a package contains at least one type declaration file.

## Consequences

* All names imported names will have type `any` and lack IntelliSense features in the editor (go to definition, hover, code completions, etc.).
* Users with `noImplicitAny` enabled will see an error on the import.

## Common causes

### Untyped ESM via package.json `"exports"`

This problem often occurs in libraries that adopted package.json `"exports"` before TypeScript added support for this feature, and haven’t updated accordingly. At the time, it would have been natural for these libraries to write a package.json like:

```json5
{
  "name": "pkg",
  "main": "./index.js",
  "types": "./index.d.ts",
  "exports": {
    "import": "./index.mjs",
    "require": "./index.js"
  }
}
```

Since TypeScript didn’t yet know about package.json `"exports"` or `.mjs` files, this was the best they could do. Imports in Node would resolve to `index.mjs`, while TypeScript would resolve to `index.d.ts` (thinking Node was going to resolve to `index.js`).

In newer TypeScript resolution modes, however, TypeScript understands that an import in Node will resolve to `index.mjs`, and so it looks for a declaration file named `index.d.mts`, which doesn’t exist.

Many users are surprised that the top-level `"types"` doesn’t act as a fallback resolution for this case, but that would result in the [“masquerading as CJS”](./FalseCJS.md) problem, since the `.mjs` file is an ES module, while the `.d.ts` file describes a CJS module. In theory, the content of `index.js` and `index.mjs` could be completely unrelated. In practice, the content is usually similar, but the mismatch in module kind is enough to cause problems that make the fallback a non-solution.

### Internal API

Sometimes a subpath defined in package.json `"exports"` isn’t designed to be used directly, so the authors didn’t bother to include types for it.
