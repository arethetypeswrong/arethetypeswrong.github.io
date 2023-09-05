# @vitejs__plugin-react@3.1.0.tgz

```
$ attw @vitejs__plugin-react@3.1.0.tgz -f table-flipped


@vitejs/plugin-react v3.1.0

❓ The JavaScript appears to set both module.exports and module.exports.default for improved compatibility, but the types only reflect the latter (by using export default). This will cause TypeScript under the node16 module mode to think an extra .default property access is required, which will work at runtime but is not necessary. These types export = an object with a default property instead of using export default. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/MissingExportEquals.md

🎭 Import resolved to a CommonJS type declaration file, but an ESM JavaScript file. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseCJS.md


┌────────────────────────┬───────────────────────┬───────────────────────┬────────────────────────┬─────────┐
│                        │ node10                │ node16 (from CJS)     │ node16 (from ESM)      │ bundler │
├────────────────────────┼───────────────────────┼───────────────────────┼────────────────────────┼─────────┤
│ "@vitejs/plugin-react" │ ❓ Missing `export =` │ ❓ Missing `export =` │ 🎭 Masquerading as CJS │ 🟢      │
└────────────────────────┴───────────────────────┴───────────────────────┴────────────────────────┴─────────┘


```

Exit code: 1