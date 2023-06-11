# rfdc@1.3.0.tgz

## Summary

```json
[
  {
    "kind": "UntypedResolution",
    "title": "Could not find types",
    "messages": [
      {
        "messageText": "Imports of `\"rfdc/default\"` under all module resolution settings resolved to JavaScript files, but no types.",
        "messageHtml": "Imports of <code>\"rfdc/default\"</code> under <strong>all module resolution settings</strong> resolved to JavaScript files, but no types."
      }
    ]
  }
]
```

## Problems

```json
[
  {
    "kind": "UntypedResolution",
    "entrypoint": "./default",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./default",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./default",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./default",
    "resolutionKind": "bundler"
  }
]
```