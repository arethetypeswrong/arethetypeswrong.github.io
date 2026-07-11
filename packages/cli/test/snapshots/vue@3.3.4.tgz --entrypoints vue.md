# vue@3.3.4.tgz --entrypoints vue

```
$ attw vue@3.3.4.tgz --entrypoints vue


vue v3.3.4

🥴 Import found in a type declaration file failed to resolve. Either this indicates that runtime resolution errors will occur, or (more likely) the types misrepresent the contents of the JavaScript files. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/InternalResolutionError.md

'../jsx' failed to resolve for entrypoint 'vue' using node16-esm with conditions 'import', 'types', 'node' from declaration '/node_modules/vue/dist/vue.d.mts': Module name '../jsx' was not resolved.


┌───────────────────┬────────────────────────────────────────┐
│                   │ "vue"                                  │
├───────────────────┼────────────────────────────────────────┤
│ node10            │ 🟢                                     │
├───────────────────┼────────────────────────────────────────┤
│ node16 (from CJS) │ 🟢 (CJS)                               │
├───────────────────┼────────────────────────────────────────┤
│ node16 (from ESM) │ 🥴 Internal resolution error: '../jsx' │
├───────────────────┼────────────────────────────────────────┤
│ bundler           │ 🟢                                     │
└───────────────────┴────────────────────────────────────────┘


```

Exit code: 1