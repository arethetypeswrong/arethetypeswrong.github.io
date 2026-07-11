# vue@3.3.4.tgz

```
$ attw vue@3.3.4.tgz -f table-flipped


vue v3.3.4

🥴 Import found in a type declaration file failed to resolve. Either this indicates that runtime resolution errors will occur, or (more likely) the types misrepresent the contents of the JavaScript files. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/InternalResolutionError.md

'../jsx' failed to resolve for entrypoint 'vue' using node16-esm with conditions 'import', 'types', 'node' from declaration '/node_modules/vue/dist/vue.d.mts': Module name '../jsx' was not resolved.

🎭 Import resolved to a CommonJS type declaration file, but an ESM JavaScript file. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseCJS.md

💀 Import failed to resolve to type declarations or JavaScript files. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/NoResolution.md

🕵️ TypeScript allows ESM named imports of the properties of this CommonJS module, but they will crash at runtime because they don’t exist or can’t be statically detected by Node.js in the JavaScript file. Use -f json to see the list of exports TypeScript can see but Node.js cannot. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/NamedExports.md


┌───────────────────────┬──────────────────────┬───────────────────┬────────────────────────────────────────┬────────────┐
│                       │ node10               │ node16 (from CJS) │ node16 (from ESM)                      │ bundler    │
├───────────────────────┼──────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┤
│ "vue"                 │ 🟢                   │ 🟢 (CJS)          │ 🥴 Internal resolution error: '../jsx' │ 🟢         │
├───────────────────────┼──────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┤
│ "vue/server-renderer" │ 🟢                   │ 🟢 (CJS)          │ 🟢 (ESM)                               │ 🟢         │
├───────────────────────┼──────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┤
│ "vue/compiler-sfc"    │ 🟢                   │ 🟢 (CJS)          │ 🟢 (ESM)                               │ 🟢         │
├───────────────────────┼──────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┤
│ "vue/jsx-runtime"     │ 🟢                   │ 🟢 (CJS)          │ 🎭 Masquerading as CJS                 │ 🟢         │
├───────────────────────┼──────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┤
│ "vue/jsx-dev-runtime" │ 💀 Resolution failed │ 🟢 (CJS)          │ 🎭 Masquerading as CJS                 │ 🟢         │
├───────────────────────┼──────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┤
│ "vue/jsx"             │ 🟢                   │ 🟢 (CJS)          │ 🟢 (CJS)                               │ 🟢         │
├───────────────────────┼──────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┤
│ "vue/dist/*"          │ (wildcard)           │ (wildcard)        │ (wildcard)                             │ (wildcard) │
├───────────────────────┼──────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┤
│ "vue/package.json"    │ 🟢 (JSON)            │ 🟢 (JSON)         │ 🟢 (JSON)                              │ 🟢 (JSON)  │
├───────────────────────┼──────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┤
│ "vue/macros"          │ 🟢                   │ 🟢 (CJS)          │ 🕵️ Named exports                       │ 🟢         │
├───────────────────────┼──────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┤
│ "vue/macros-global"   │ 🟢                   │ 🟢 (CJS)          │ 🟢 (CJS)                               │ 🟢         │
├───────────────────────┼──────────────────────┼───────────────────┼────────────────────────────────────────┼────────────┤
│ "vue/ref-macros"      │ 🟢                   │ 🟢 (CJS)          │ 🟢 (CJS)                               │ 🟢         │
└───────────────────────┴──────────────────────┴───────────────────┴────────────────────────────────────────┴────────────┘


```

Exit code: 1