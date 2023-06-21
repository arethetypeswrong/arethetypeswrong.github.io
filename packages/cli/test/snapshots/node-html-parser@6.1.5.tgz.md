# node-html-parser@6.1.5.tgz

```
$ attw node-html-parser@6.1.5.tgz


🤨 CommonJS module simulates a default export with exports.default and exports.__esModule, but does not also set module.exports for compatibility with Node. Node, and some bundlers under certain conditions (https://andrewbranch.github.io/interop-test/#synthesizing-default-exports-for-cjs-modules), do not respect the __esModule marker, so accessing the intended default export will require a .default property access on the default import. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/CJSOnlyExportsDefault.md


┌────────────────────┬───────────────────────────────────┐
│                    │ "node-html-parser"                │
├────────────────────┼───────────────────────────────────┤
│ node10             │ 🤨 CJS default export             │
├────────────────────┼───────────────────────────────────┤
│ node16 (from CJS)  │ 🤨 CJS default export             │
├────────────────────┼───────────────────────────────────┤
│ node16 (from ESM)  │ 🤨 CJS default export             │
├────────────────────┼───────────────────────────────────┤
│ bundler            │ 🤨 CJS default export             │
└────────────────────┴───────────────────────────────────┘


```

Exit code: 1