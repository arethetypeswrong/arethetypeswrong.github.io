# ❓ Missing `export =`

The JavaScript appears to set both `module.exports` and `module.exports.default` for improved compatibility, but the types only reflect the latter (by using `export default`). This will cause TypeScript under the `node16` module mode to think an extra `.default` property access is required, which will work at runtime but is not necessary. These types `export =` an object with a `default` property instead of using `export default`.

## Explanation

This problem occurs when a CommonJS JavaScript file appears to use a compatibility pattern like:

```js
class Whatever {
  /* ... */
}
Whatever.default = Whatever;
module.exports = Whatever;
```

but the corresponding type definitions only reflect the existence of the `module.exports.default` property:

```ts
declare class Whatever {
  /* ... */
}
export default Whatever;
```

The types should declare the existence of the `Whatever` class on both `module.exports` and `module.exports.default`. The method of doing this can vary depending on the kinds of things already being exported from the types. When the `export default` exports a class, and that class is the only export in the file, the `default` can be declared as a static property on the class, and the `export default` swapped for `export =`:

```ts
declare class Whatever {
  static default: typeof Whatever;
  /* ... */
}
export = Whatever;
```

When the file exports additional types, it will be necessary to declare a `namespace` that merges with the class and contains the exported types:

```ts
declare class Whatever {
  static default: typeof Whatever;
  /* ... */
}
declare namespace Whatever {
  export interface WhateverProps {
    /* ... */
  }
}
export = Whatever;
```

This merging namespace can also be used to declare the `default` property when the main export is a function:

```ts
declare function Whatever(props: Whatever.WhateverProps): void;
declare namespace Whatever {
  // using `import =` syntax ensures the CJS-default-import continues to work as a namespace
  import _default = Whatever;
  export { _default as default };

  export interface WhateverProps {
    /* ... */
  }
}
export = Whatever;
```

## Consequences

This problem is similar to the [“Incorrect default export”](./FalseExportDefault.md) problem, but in this case, the types are _incomplete_ rather than wholly incorrect. This incompleteness may lead TypeScript users importing from Node.js ESM code, or CommonJS code without `esModuleInterop` enabled, to add an extra `.default` property onto default imports to access the module’s `module.exports.default` property, even though accessing the `module.exports` would have been sufficient.

```ts
import Whatever from "pkg";
Whatever.default(); // Ok, but `Whatever()` would have worked!
```

## Common causes

This problem is usually caused by library authors incorrectly hand-authoring declaration files to match existing JavaScript rather than generating JavaScript and type declarations from TypeScript with `tsc`, or by using a third-party TypeScript emitter that adds an extra compatibility layer to TypeScript written with `export default`. Libraries compiling to CommonJS should generally avoid writing `export default` as input syntax.
