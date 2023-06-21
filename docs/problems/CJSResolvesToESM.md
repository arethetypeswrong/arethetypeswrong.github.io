# ⚠️ Entrypoint is ESM-only

A `require` call resolved to an ESM JavaScript file, which is an error in Node and some bundlers. CommonJS consumers will need to use a dynamic import.

## Explanation

This is the “true” version of the [“Masquerading as ESM”](./FalseESM.md) problem. Whereas that problem indicates that the types are ESM even though a CJS implementation is available, this problem indicates that the types and implementation are both ESM even though CJS was requested. The errors the user will see are the same, but in this case, the error is correct about the problem that will occur at runtime. As such, this problem does _not_ indicate that “the types are wrong”; rather, it’s surfaced to highlight that certain consumers will be unable to use this module.

## Consequences

CommonJS consumers in Node will not be able to use this module without a dynamic `import()`, which introduces asynchronicity. Introducing asynchronicity into a large synchronous codebase can be a prohibitively difficult refactor and a breaking change for downstream APIs, so in practice the consequence is often that consumers will not be able to use this module at all.

```ts
  import mod from "pkg";
  //              ^^^^^
  // The current file is a CommonJS module whose imports will produce 'require'
  // calls; however, the referenced file is an ECMAScript module and cannot be
  // imported with 'require'. Consider writing a dynamic 'import("pkg")' call
  // instead.
  ```

## Common causes

This usually happens when a library only contains ESM after making a conscious decision not to support CommonJS. (This tool tries to be neutral on that decision, but by default shows what happens in many module resolution scenarios. The author of this tool encourages library authors to consider their constraints, understand their users, and move in the direction of ESM-only when possible.)
