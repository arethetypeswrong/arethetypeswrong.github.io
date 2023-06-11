# node-html-parser@6.1.5.tgz

## Summary

```json
[
  {
    "kind": "CJSOnlyExportsDefault",
    "title": "CJS module uses default export",
    "messages": [
      {
        "messageText": "The CJS module resolved at the package under contains a simulated `export default` with an `__esModule` marker, but no top-level `module.exports`. Node does not respect the `__esModule` marker, so accessing the intended default export will require a `.default` property access in Node from an ES module.",
        "messageHtml": "The CJS module resolved at the package under contains a simulated <code>export default</code> with an <code>__esModule</code> marker, but no top-level <code>module.exports</code>. Node does not respect the <code>__esModule</code> marker, so accessing the intended default export will require a <code>.default</code> property access in Node from an ES module."
      }
    ]
  }
]
```

## Problems

```json
[
  {
    "kind": "CJSOnlyExportsDefault",
    "entrypoint": ".",
    "resolutionKind": "node16-esm"
  }
]
```