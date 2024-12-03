# ajv@8.12.0.tgz

```
$ attw ajv@8.12.0.tgz -f table-flipped


ajv v8.12.0

Build tools:
- typescript@^4.8.0
- rollup@^2.44.0
- @rollup/plugin-typescript@^10.0.1

❓ The JavaScript appears to set both module.exports and module.exports.default for improved compatibility, but the types only reflect the latter (by using export default). This will cause TypeScript under the node16 module mode to think an extra .default property access is required, which will work at runtime but is not necessary. These types should export = an object with a default property instead of using export default. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/MissingExportEquals.md


┌───────┬───────────────────────┬───────────────────────┬───────────────────────┬───────────────────────┐
│       │ node10                │ node16 (from CJS)     │ node16 (from ESM)     │ bundler               │
├───────┼───────────────────────┼───────────────────────┼───────────────────────┼───────────────────────┤
│ "ajv" │ ❓ Missing `export =` │ ❓ Missing `export =` │ ❓ Missing `export =` │ ❓ Missing `export =` │
└───────┴───────────────────────┴───────────────────────┴───────────────────────┴───────────────────────┘


```

Exit code: 1