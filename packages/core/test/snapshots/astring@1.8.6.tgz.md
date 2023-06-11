# astring@1.8.6.tgz

## Summary

```json
[
  {
    "kind": "FalseCJS",
    "title": "Types are CJS, but implementation is ESM",
    "messages": [
      {
        "messageText": "Imports of the package under the `node16` module resolution setting when the importing module is ESM (its extension is `.mts` or `.mjs`, or it has a `.ts` or `.js` extension and is in scope of a `package.json` that contains `\"type\": \"module\"`) resolved to CJS types, but ESM implementations.",
        "messageHtml": "Imports of the package under the <code>node16</code> module resolution setting when the importing module is ESM (its extension is <code>.mts</code> or <code>.mjs</code>, or it has a <code>.ts</code> or <code>.js</code> extension and is in scope of a <code>package.json</code> that contains <code>\"type\": \"module\"</code>) resolved to CJS types, but ESM implementations."
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
  }
]
```