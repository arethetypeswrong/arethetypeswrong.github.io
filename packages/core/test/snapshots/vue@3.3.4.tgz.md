# vue@3.3.4.tgz

## Problems

```json
[
  {
    "kind": "FalseCJS",
    "entrypoint": "./jsx-runtime",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "NoResolution",
    "entrypoint": "./jsx-dev-runtime",
    "resolutionKind": "node10"
  },
  {
    "kind": "FalseCJS",
    "entrypoint": "./jsx-dev-runtime",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "Wildcard",
    "entrypoint": "./dist/*",
    "resolutionKind": "node10"
  },
  {
    "kind": "Wildcard",
    "entrypoint": "./dist/*",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "Wildcard",
    "entrypoint": "./dist/*",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "Wildcard",
    "entrypoint": "./dist/*",
    "resolutionKind": "bundler"
  },
  {
    "kind": "InternalResolutionError",
    "resolutionOption": "node16",
    "fileName": "/node_modules/vue/dist/vue.d.mts",
    "error": {
      "moduleSpecifier": "../jsx",
      "pos": 454,
      "end": 463,
      "resolutionMode": 99
    }
  }
]
```