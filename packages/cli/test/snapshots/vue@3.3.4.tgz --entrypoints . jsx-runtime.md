# vue@3.3.4.tgz --entrypoints . jsx-runtime

```
$ attw vue@3.3.4.tgz --entrypoints . jsx-runtime


vue v3.3.4

🥴 Import found in a type declaration file failed to resolve. Either this indicates that runtime resolution errors will occur, or (more likely) the types misrepresent the contents of the JavaScript files. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/InternalResolutionError.md

  '../jsx' failed to resolve using node16-esm from '/node_modules/vue/dist/vue.d.mts'

🎭 Import resolved to a CommonJS type declaration file, but an ESM JavaScript file. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseCJS.md


┌───────────────────┬────────────────────────────────────────┬────────────────────────┐
│                   │ "vue"                                  │ "vue/jsx-runtime"      │
├───────────────────┼────────────────────────────────────────┼────────────────────────┤
│ node10            │ 🟢                                     │ 🟢                     │
├───────────────────┼────────────────────────────────────────┼────────────────────────┤
│ node16 (from CJS) │ 🟢 (CJS)                               │ 🟢 (CJS)               │
├───────────────────┼────────────────────────────────────────┼────────────────────────┤
│ node16 (from ESM) │ 🥴 Internal resolution error: '../jsx' │ 🎭 Masquerading as CJS │
├───────────────────┼────────────────────────────────────────┼────────────────────────┤
│ bundler           │ 🟢                                     │ 🟢                     │
└───────────────────┴────────────────────────────────────────┴────────────────────────┘


```

Exit code: 1