# 🕵️ Named ESM exports

TypeScript allows ESM named imports of the properties of this CommonJS module, but they will crash at runtime because they don’t exist or can’t be statically detected by Node.js in the JavaScript file.

## Explanation

When you import a CommonJS module in Node.js, the runtime uses [cjs-module-lexer](https://github.com/nodejs/cjs-module-lexer) to determine what properties of the target’s `module.exports` can be accessed with named imports. This problem is detected by running cjs-module-lexer over the JavaScript and comparing the list of exports it finds with the list of (value, non-type-only) exports exposed in the type declaration file. This problem is only issued when the _types_ contain exports not found in the _JavaScript_, not vice versa. (That is, it’s ok for types to be incomplete, but not to declare exports that don’t exist at runtime.)

## Consequences

Node.js will crash at startup when accessing the missing exports as named imports:

```ts
import { a } from "./api.cjs";
// SyntaxError: Named export 'a' not found. The requested module './api.cjs' is a CommonJS module,
// which may not support all module.exports as named exports.

import api from "./api.cjs";
api.a; // Ok
```

## Common causes

### Incorrect types

If the types were written by hand, it’s possible that they contain exports that just don’t exist at all in the JavaScript.

### Unanalyzable JavaScript

The static analysis supported by cjs-module-lexer is somewhat limited; for example, this works:

```js
// api.cjs
exports.a = "a";

// main.mjs
import { a } from "./api.cjs";
```

but this does not:

```js
// api.cjs
module.exports = {
  a: "a",
};

// main.mjs
import { a } from "./api.cjs";
```

However, TypeScript has no way of knowing, and no way of indicating in a declaration file, whether CommonJS exports are written in a way that will be statically analyzable. It assumes they _will_ be, and so even a completely correct declaration file for `api.cjs` will indicate that `a` can be imported by name. Since there’s no way to make the types more restrictive without making them incomplete, and since the unalyzable export is an inconvenience for all consumers of the JavaScript, the only solution is to fix the JavaScript. If the JavaScript exports can’t be restructured, it’s possible to “hint” the exports to cjs-module-lexer with an assignment that never executes:

```js
module.exports = {
  a: "a", // can't understand this...
};

0 &&
  (module.exports = {
    a, // but it can understand this, even though it will never run
  });
```
