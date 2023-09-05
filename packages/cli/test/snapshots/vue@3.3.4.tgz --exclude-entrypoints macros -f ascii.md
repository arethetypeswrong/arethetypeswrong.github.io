# vue@3.3.4.tgz --exclude-entrypoints macros -f ascii

```
$ attw vue@3.3.4.tgz --exclude-entrypoints macros -f ascii


vue v3.3.4

🎭 Import resolved to a CommonJS type declaration file, but an ESM JavaScript file. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseCJS.md

💀 Import failed to resolve to type declarations or JavaScript files. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/NoResolution.md

🃏 Wildcard subpaths cannot yet be analyzed by this tool. https://github.com/arethetypeswrong/arethetypeswrong.github.io/issues/40

🥴 Import found in a type declaration file failed to resolve. Either this indicates that runtime resolution errors will occur, or (more likely) the types misrepresent the contents of the JavaScript files. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/InternalResolutionError.md


"vue"

node10: 🟢 
node16 (from CJS): 🟢 (CJS)
node16 (from ESM): 🥴 Internal resolution error
bundler: 🟢 

***********************************

"vue/server-renderer"

node10: 🟢 
node16 (from CJS): 🟢 (CJS)
node16 (from ESM): 🟢 (ESM)
bundler: 🟢 

***********************************

"vue/compiler-sfc"

node10: 🟢 
node16 (from CJS): 🟢 (CJS)
node16 (from ESM): 🟢 (ESM)
bundler: 🟢 

***********************************

"vue/jsx-runtime"

node10: 🟢 
node16 (from CJS): 🟢 (CJS)
node16 (from ESM): 🎭 Masquerading as CJS
bundler: 🟢 

***********************************

"vue/jsx-dev-runtime"

node10: 💀 Resolution failed
node16 (from CJS): 🟢 (CJS)
node16 (from ESM): 🎭 Masquerading as CJS
bundler: 🟢 

***********************************

"vue/jsx"

node10: 🟢 
node16 (from CJS): 🟢 (CJS)
node16 (from ESM): 🟢 (CJS)
bundler: 🟢 

***********************************

"vue/dist/*"

node10: 🃏 Unable to check
node16 (from CJS): 🃏 Unable to check
node16 (from ESM): 🃏 Unable to check
bundler: 🃏 Unable to check

***********************************

"vue/package.json"

node10: 🟢 (JSON)
node16 (from CJS): 🟢 (JSON)
node16 (from ESM): 🟢 (JSON)
bundler: 🟢 (JSON)

***********************************

"vue/macros-global"

node10: 🟢 
node16 (from CJS): 🟢 (CJS)
node16 (from ESM): 🟢 (CJS)
bundler: 🟢 

***********************************

"vue/ref-macros"

node10: 🟢 
node16 (from CJS): 🟢 (CJS)
node16 (from ESM): 🟢 (CJS)
bundler: 🟢 

***********************************


```

Exit code: 1