# commander@10.0.1.tgz -f table

```
$ attw commander@10.0.1.tgz -f table


commander v10.0.1

Build tools:
- typescript@^4.9.4

🎭 Import resolved to a CommonJS type declaration file, but an ESM JavaScript file. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseCJS.md

❌ Import resolved to JavaScript files, but no type declarations were found. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/UntypedResolution.md

⚠️ A require call resolved to an ESM JavaScript file, which is an error in Node and some bundlers. CommonJS consumers will need to use a dynamic import. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/CJSResolvesToESM.md


┌───────────────────┬────────────────────────┬──────────────────────────────┐
│                   │ "commander"            │ "commander/esm.mjs"          │
├───────────────────┼────────────────────────┼──────────────────────────────┤
│ node10            │ 🟢                     │ ❌ No types                  │
├───────────────────┼────────────────────────┼──────────────────────────────┤
│ node16 (from CJS) │ 🟢 (CJS)               │ ❌ No types                  │
│                   │                        │ ⚠️ ESM (dynamic import only) │
├───────────────────┼────────────────────────┼──────────────────────────────┤
│ node16 (from ESM) │ 🎭 Masquerading as CJS │ ❌ No types                  │
├───────────────────┼────────────────────────┼──────────────────────────────┤
│ bundler           │ 🟢                     │ ❌ No types                  │
└───────────────────┴────────────────────────┴──────────────────────────────┘


```

Exit code: 1