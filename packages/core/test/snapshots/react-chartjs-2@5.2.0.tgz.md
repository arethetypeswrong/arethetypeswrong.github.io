# react-chartjs-2@5.2.0.tgz

## Summary

```json
[
  {
    "kind": "FalseESM",
    "title": "Types are ESM, but implementation is CJS",
    "messages": [
      {
        "messageText": "Imports of the package under the `node16` module resolution setting when the importing module is CJS (its extension is `.cts` or `.cjs`, or it has a `.ts` or `.js` extension and is in scope of a `package.json` that does not contain `\"type\": \"module\"`) resolved to ESM types, but CJS implementations.",
        "messageHtml": "Imports of the package under the <code>node16</code> module resolution setting when the importing module is CJS (its extension is <code>.cts</code> or <code>.cjs</code>, or it has a <code>.ts</code> or <code>.js</code> extension and is in scope of a <code>package.json</code> that does not contain <code>\"type\": \"module\"</code>) resolved to ESM types, but CJS implementations."
      }
    ]
  },
  {
    "kind": "CJSResolvesToESM",
    "title": "Entrypoint is ESM-only",
    "messages": [
      {
        "messageText": "Imports of the package resolved to ES modules from a CJS importing module. CJS modules in Node will only be able to access this entrypoint with a dynamic import.",
        "messageHtml": "Imports of the package resolved to ES modules from a CJS importing module. CJS modules in Node will only be able to access this entrypoint with a dynamic import."
      }
    ]
  }
]
```

## Problems

```json
[
  {
    "kind": "FalseESM",
    "entrypoint": ".",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": ".",
    "resolutionKind": "node16-cjs"
  }
]
```