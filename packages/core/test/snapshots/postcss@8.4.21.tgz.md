# postcss@8.4.21.tgz

## Summary

```json
[
  {
    "kind": "FalseCJS",
    "title": "Types are CJS, but implementation is ESM",
    "messages": [
      {
        "messageText": "Imports of `\"postcss\"` under the `node16` module resolution setting when the importing module is ESM (its extension is `.mts` or `.mjs`, or it has a `.ts` or `.js` extension and is in scope of a `package.json` that contains `\"type\": \"module\"`) resolved to CJS types, but ESM implementations.",
        "messageHtml": "Imports of <code>\"postcss\"</code> under the <code>node16</code> module resolution setting when the importing module is ESM (its extension is <code>.mts</code> or <code>.mjs</code>, or it has a <code>.ts</code> or <code>.js</code> extension and is in scope of a <code>package.json</code> that contains <code>\"type\": \"module\"</code>) resolved to CJS types, but ESM implementations."
      }
    ]
  },
  {
    "kind": "FallbackCondition",
    "title": "Resloved through fallback condition",
    "messages": [
      {
        "messageText": "Imports of `\"postcss\"` under resolution modes that use the `import` condition in package.json `\"exports\"` resolved through a conditional package.json export, but only after failing to resolve through an earlier condition. This behavior is a TypeScript bug (https://github.com/microsoft/TypeScript/issues/50762) and should not be relied upon.",
        "messageHtml": "Imports of <code>\"postcss\"</code> under resolution modes that use the <code>import</code> condition in package.json <code>\"exports\"</code> resolved through a conditional package.json export, but only after failing to resolve through an earlier condition. This behavior is a <a href=\"https://github.com/microsoft/TypeScript/issues/50762\">TypeScript bug</a> and should not be relied upon."
      }
    ]
  },
  {
    "kind": "FalseExportDefault",
    "title": "Types incorrectly use default export",
    "messages": [
      {
        "messageText": "The types resolved at multiple entrypoints use `export default` where the implementation appears to use `module.exports =`. Node treats a default import of these constructs from an ES module differently, so these types will make TypeScript under the `node16` resolution mode think an extra `.default` property access is required, but that will likely fail at runtime in Node. These types should use `export =` instead of `export default`.",
        "messageHtml": "The types resolved at <strong>multiple entrypoints</strong> use <code>export default</code> where the implementation appears to use <code>module.exports =</code>. Node treats a default import of these constructs from an ES module differently, so these types will make TypeScript under the <code>node16</code> resolution mode think an extra <code>.default</code> property access is required, but that will likely fail at runtime in Node. These types should use <code>export =</code> instead of <code>export default</code>."
      }
    ]
  },
  {
    "kind": "UntypedResolution",
    "title": "Could not find types",
    "messages": [
      {
        "messageText": "Imports of multiple entrypoints under all module resolution settings resolved to JavaScript files, but no types.",
        "messageHtml": "Imports of <strong>multiple entrypoints</strong> under <strong>all module resolution settings</strong> resolved to JavaScript files, but no types."
      }
    ]
  }
]
```

## Problems

```json
[
  {
    "kind": "FalseCJS",
    "entrypoint": ".",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FallbackCondition",
    "entrypoint": ".",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FallbackCondition",
    "entrypoint": ".",
    "resolutionKind": "bundler"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/at-rule",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/comment",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/container",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/css-syntax-error",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/declaration",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/fromJSON",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/input",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/lazy-result",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/no-work-result",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/list",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/map-generator",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/map-generator",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/map-generator",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/map-generator",
    "resolutionKind": "bundler"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/node",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/parse",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/parser",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/parser",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/parser",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/parser",
    "resolutionKind": "bundler"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/postcss",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/previous-map",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/processor",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/result",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/root",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/rule",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/stringifier",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/stringify",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/symbols",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/symbols",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/symbols",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/symbols",
    "resolutionKind": "bundler"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/terminal-highlight",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/terminal-highlight",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/terminal-highlight",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/terminal-highlight",
    "resolutionKind": "bundler"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/tokenize",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/tokenize",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/tokenize",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/tokenize",
    "resolutionKind": "bundler"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/warn-once",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/warn-once",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/warn-once",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./lib/warn-once",
    "resolutionKind": "bundler"
  },
  {
    "kind": "FalseExportDefault",
    "entrypoint": "./lib/warning",
    "resolutionKind": "node16-esm"
  }
]
```