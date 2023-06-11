# ajv@8.12.0.tgz

## Summary

```json
[
  {
    "kind": "FalseExportDefault",
    "title": "Types incorrectly use default export",
    "messages": [
      {
        "messageText": "The types resolved at the package use `export default` where the implementation appears to use `module.exports =`. Node treats a default import of these constructs from an ES module differently, so these types will make TypeScript under the `node16` resolution mode think an extra `.default` property access is required, but that will likely fail at runtime in Node. These types should use `export =` instead of `export default`.",
        "messageHtml": "The types resolved at the package use <code>export default</code> where the implementation appears to use <code>module.exports =</code>. Node treats a default import of these constructs from an ES module differently, so these types will make TypeScript under the <code>node16</code> resolution mode think an extra <code>.default</code> property access is required, but that will likely fail at runtime in Node. These types should use <code>export =</code> instead of <code>export default</code>."
      }
    ]
  }
]
```

## Problems

```json
[
  {
    "kind": "FalseExportDefault",
    "entrypoint": ".",
    "resolutionKind": "node16-esm"
  }
]
```