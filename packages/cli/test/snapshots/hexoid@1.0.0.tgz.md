# hexoid@1.0.0.tgz

```
$ attw hexoid@1.0.0.tgz -f table-flipped


hexoid v1.0.0

❗️ The resolved types use export default where the JavaScript file appears to use module.exports =. This will cause TypeScript under the node16 module mode to think an extra .default property access is required, but that will likely fail at runtime. These types should use export = instead of export default. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseExportDefault.md


┌──────────┬──────────────────────────────┬──────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│          │ node10                       │ node16 (from CJS)            │ node16 (from ESM)            │ bundler                      │
├──────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ "hexoid" │ ❗️ Incorrect default export │ ❗️ Incorrect default export │ ❗️ Incorrect default export │ ❗️ Incorrect default export │
└──────────┴──────────────────────────────┴──────────────────────────────┴──────────────────────────────┴──────────────────────────────┘


```

Exit code: 1