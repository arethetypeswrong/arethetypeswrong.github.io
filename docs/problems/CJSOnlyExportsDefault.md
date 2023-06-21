# 🤨 CJS default export

CommonJS module simulates a default export with `exports.default` and `exports.__esModule`, but does not also set `module.exports` for compatibility with Node. Node, and [some bundlers under certain conditions](https://andrewbranch.github.io/interop-test/#synthesizing-default-exports-for-cjs-modules), do not respect the `__esModule` marker, so accessing the intended default export will require a `.default` property access on the default import.

## Explanation

This problem does not indicate that the types are wrong, but rather that the API exposed may have compatibility problems between Node and bundlers, and will need to be consumed in Node ES modules in a way that the author likely did not intend. It occurs when both of the following conditions are true:

* A JavaScript file assigns `exports.default = ...` and has an `exports.__esModule = true` or similar method of setting the `__esModule` flag. (This pattern indicates that the CommonJS module has been transpiled from an ES module that used a default export.)
* There is not an additional assignment to `module.exports = ...`, indicating that a compatibility pattern like `module.exports.default = module.exports = ...` was not used.

When these are true, imports in Node will behave differently from imports in most bundlers. Node always synthesizes a default export for CommonJS modules that points to their `module.exports` objects, whereas most bundlers use the `__esModule` property as an indicator that the default export of the CommonJS module should be the value found at `exports.default`. So for a CommonJS module like:

```js
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function f() { /* ... */ };
```

a program with a default import like:

```js
import mod from "pkg";
console.log(mod);
```

will result in `{ default: [Function: f] }` in Node, but `[Function: f]` in most bundlers. ([This table](https://andrewbranch.github.io/interop-test/#synthesizing-default-exports-for-cjs-modules) shows the behavior of several bundlers and the Bun runtime under different conditions.)

The divergence in behavior between various runtimes and bundlers can be mitigated by assigning the value intended to be the default export to `module.exports`, then additionally assigning a circular `default` property on that object back to itself:

```js
Object.defineProperty(exports, "__esModule", { value: true });
function f() { /* ... */ };
module.exports = f;
module.exports.default = f;
```

This compatibility pattern has an odd effect where `f.default.default.default...` out to infinity is equal to `f`, but nonetheless, all runtimes and bundlers will bind a default import of the module to a callable `f`.

## Consequences

* Consumers in Node will need to access the module’s intended export with `mod.default` where `mod` is already a default import, which is likely not the author’s intention.
* It may be impossible or inconvenient for consumers to write code that works both in Node and in bundlers.

## Common causes

This problem occurs when library authors compile ES modules that use `export default` to CommonJS with a transpiler that does not add the `module.exports` compatibility strategy discussed above (such as `tsc` itself). Library authors who ship CommonJS to npm are encouraged not to use default exports, or to apply a transform to their output that applies such a compatibility layer.
