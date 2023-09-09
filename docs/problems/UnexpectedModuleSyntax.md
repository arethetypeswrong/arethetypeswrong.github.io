# 🚭 Unexpected module syntax

Syntax detected in the module is incompatible with the module kind according to the package.json or file extension. This is an error in Node and may cause problems in some bundlers.

## Explanation

In Node, and in [some bundlers](https://andrewbranch.github.io/interop-test/#synthesizing-default-exports-for-cjs-modules), files are determined to be ES modules or CommonJS modules by their file extension and ancestor package.json `"type"` field. This problem occurs when a JavaScript file that Node would interpret as CommonJS contains top-level `import` or `export` declarations or `export` modifiers (which would be a syntax error), or when a JavaScript file that Node would interpret as ESM uses `module.exports` or `require` (which would likely be a runtime error). (ESM files that use both CommonJS and ESM syntax do not raise this problem, as it’s assumed that these files are correctly using `require` via `createRequire`.)

This is not an instance of incorrect types, but rather a runtime module configuration that is likely to cause problems.

## Consequences

If Node (or a bundler that uses Node’s rules for module detection) consumes a file that triggers this problem, it will crash (or fail to bundle).

## Common causes

This problem may be caused by packages that were only intended to be consumed by bundlers for frontend use. Many bundlers can consume files that use ES module syntax without conforming to Node’s rules for what counts as an ES module. If the library author never anticipated the library being used in Node, they may have ignored Node’s rule for module detection, or even published the library before Node supported ES modules at all.
