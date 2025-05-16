# axios@1.4.0.tgz --pm yarn-classic

```
$ attw axios@1.4.0.tgz --pm yarn-classic


axios v1.4.0

Build tools:
- typescript@^4.8.4
- rollup@^2.67.0

💀 Import failed to resolve to type declarations or JavaScript files. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/NoResolution.md

❌ Import resolved to JavaScript files, but no type declarations were found. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/UntypedResolution.md

⚠️ A require call resolved to an ESM JavaScript file, which is an error in Node and some bundlers. CommonJS consumers will need to use a dynamic import. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/CJSResolvesToESM.md


┌─────────────────────────────────────────┬──────────────────────┬──────────────────────────────┬───────────────────┬─────────────┐
│                                         │ node10               │ node16 (from CJS)            │ node16 (from ESM) │ bundler     │
├─────────────────────────────────────────┼──────────────────────┼──────────────────────────────┼───────────────────┼─────────────┤
│ "axios"                                 │ 🟢                   │ 🟢 (CJS)                     │ 🟢 (ESM)          │ 🟢          │
├─────────────────────────────────────────┼──────────────────────┼──────────────────────────────┼───────────────────┼─────────────┤
│ "axios/unsafe/*"                        │ (wildcard)           │ (wildcard)                   │ (wildcard)        │ (wildcard)  │
├─────────────────────────────────────────┼──────────────────────┼──────────────────────────────┼───────────────────┼─────────────┤
│ "axios/unsafe/core/settle.js"           │ 💀 Resolution failed │ ❌ No types                  │ ❌ No types       │ ❌ No types │
│                                         │                      │ ⚠️ ESM (dynamic import only) │                   │             │
├─────────────────────────────────────────┼──────────────────────┼──────────────────────────────┼───────────────────┼─────────────┤
│ "axios/unsafe/core/buildFullPath.js"    │ 💀 Resolution failed │ ❌ No types                  │ ❌ No types       │ ❌ No types │
│                                         │                      │ ⚠️ ESM (dynamic import only) │                   │             │
├─────────────────────────────────────────┼──────────────────────┼──────────────────────────────┼───────────────────┼─────────────┤
│ "axios/unsafe/helpers/isAbsoluteURL.js" │ 💀 Resolution failed │ ❌ No types                  │ ❌ No types       │ ❌ No types │
│                                         │                      │ ⚠️ ESM (dynamic import only) │                   │             │
├─────────────────────────────────────────┼──────────────────────┼──────────────────────────────┼───────────────────┼─────────────┤
│ "axios/unsafe/helpers/buildURL.js"      │ 💀 Resolution failed │ ❌ No types                  │ ❌ No types       │ ❌ No types │
│                                         │                      │ ⚠️ ESM (dynamic import only) │                   │             │
├─────────────────────────────────────────┼──────────────────────┼──────────────────────────────┼───────────────────┼─────────────┤
│ "axios/unsafe/helpers/combineURLs.js"   │ 💀 Resolution failed │ ❌ No types                  │ ❌ No types       │ ❌ No types │
│                                         │                      │ ⚠️ ESM (dynamic import only) │                   │             │
├─────────────────────────────────────────┼──────────────────────┼──────────────────────────────┼───────────────────┼─────────────┤
│ "axios/unsafe/adapters/http.js"         │ 💀 Resolution failed │ ❌ No types                  │ ❌ No types       │ ❌ No types │
│                                         │                      │ ⚠️ ESM (dynamic import only) │                   │             │
├─────────────────────────────────────────┼──────────────────────┼──────────────────────────────┼───────────────────┼─────────────┤
│ "axios/unsafe/adapters/xhr.js"          │ 💀 Resolution failed │ ❌ No types                  │ ❌ No types       │ ❌ No types │
│                                         │                      │ ⚠️ ESM (dynamic import only) │                   │             │
├─────────────────────────────────────────┼──────────────────────┼──────────────────────────────┼───────────────────┼─────────────┤
│ "axios/unsafe/utils.js"                 │ 💀 Resolution failed │ ❌ No types                  │ ❌ No types       │ ❌ No types │
│                                         │                      │ ⚠️ ESM (dynamic import only) │                   │             │
├─────────────────────────────────────────┼──────────────────────┼──────────────────────────────┼───────────────────┼─────────────┤
│ "axios/package.json"                    │ 🟢 (JSON)            │ 🟢 (JSON)                    │ 🟢 (JSON)         │ 🟢 (JSON)   │
└─────────────────────────────────────────┴──────────────────────┴──────────────────────────────┴───────────────────┴─────────────┘


```

Exit code: 1