# react-chartjs-2@5.2.0.tgz

```
$ attw react-chartjs-2@5.2.0.tgz -f table-flipped


👺 Import resolved to an ESM type declaration file, but a CommonJS JavaScript file. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseESM.md

⚠️ A require call resolved to an ESM JavaScript file, which is an error in Node and some bundlers. CommonJS consumers will need to use a dynamic import. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/CJSResolvesToESM.md


┌───────────────────┬────────┬──────────────────────────────┬───────────────────┬─────────┐
│                   │ node10 │ node16 (from CJS)            │ node16 (from ESM) │ bundler │
├───────────────────┼────────┼──────────────────────────────┼───────────────────┼─────────┤
│ "react-chartjs-2" │ 🟢     │ 👺 Masquerading as ESM       │ 🟢 (ESM)          │ 🟢      │
│                   │        │ ⚠️ ESM (dynamic import only) │                   │         │
└───────────────────┴────────┴──────────────────────────────┴───────────────────┴─────────┘


```

Exit code: 1