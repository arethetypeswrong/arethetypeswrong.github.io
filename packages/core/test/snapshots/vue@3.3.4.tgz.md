# vue@3.3.4.tgz

## Summary

```json
[
  {
    "kind": "FalseCJS",
    "title": "Types are CJS, but implementation is ESM",
    "messages": [
      {
        "messageText": "Imports of multiple entrypoints under the `node16` module resolution setting when the importing module is ESM (its extension is `.mts` or `.mjs`, or it has a `.ts` or `.js` extension and is in scope of a `package.json` that contains `\"type\": \"module\"`) resolved to CJS types, but ESM implementations.",
        "messageHtml": "Imports of <strong>multiple entrypoints</strong> under the <code>node16</code> module resolution setting when the importing module is ESM (its extension is <code>.mts</code> or <code>.mjs</code>, or it has a <code>.ts</code> or <code>.js</code> extension and is in scope of a <code>package.json</code> that contains <code>\"type\": \"module\"</code>) resolved to CJS types, but ESM implementations."
      }
    ]
  },
  {
    "kind": "NoResolution",
    "title": "Resolution failed",
    "messages": [
      {
        "messageText": "Imports of `\"vue/jsx-dev-runtime\"` under the `node10` module resolution setting failed to resolve.",
        "messageHtml": "Imports of <code>\"vue/jsx-dev-runtime\"</code> under the <code>node10</code> module resolution setting failed to resolve."
      }
    ]
  },
  {
    "kind": "UnexpectedESMSyntax",
    "title": "Syntax is incompatible with detected module kind",
    "messages": [
      {
        "messageText": "The implementation resolved at multiple entrypoints uses ESM syntax, but the detected module kind is CJS. This will be an error in Node (and potentially other runtimes and bundlers). The module kind was decided based on the nearest package.json’s lack of a `\"type\": \"module\"` field.",
        "messageHtml": "The implementation resolved at <strong>multiple entrypoints</strong> uses ESM syntax, but the detected module kind is CJS. This will be an error in Node (and potentially other runtimes and bundlers). The module kind was decided based on the nearest package.json’s lack of a <code>\"type\": \"module\"</code> field."
      },
      {
        "messageText": "The implementation resolved at multiple entrypoints uses ESM syntax, but the detected module kind is CJS. This will be an error in Node (and potentially other runtimes and bundlers). The module kind was decided based on the nearest package.json’s lack of a `\"type\": \"module\"` field.",
        "messageHtml": "The implementation resolved at <strong>multiple entrypoints</strong> uses ESM syntax, but the detected module kind is CJS. This will be an error in Node (and potentially other runtimes and bundlers). The module kind was decided based on the nearest package.json’s lack of a <code>\"type\": \"module\"</code> field."
      }
    ]
  },
  {
    "kind": "Wildcard",
    "title": "Wildcards",
    "messages": [
      {
        "messageText": "Wildcards cannot yet be analyzed by this tool.",
        "messageHtml": "Wildcards cannot yet be analyzed by this tool."
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
    "kind": "UnexpectedESMSyntax",
    "entrypoint": "./jsx",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UnexpectedESMSyntax",
    "entrypoint": "./jsx",
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
    "kind": "UnexpectedESMSyntax",
    "entrypoint": "./macros",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UnexpectedESMSyntax",
    "entrypoint": "./macros",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UnexpectedESMSyntax",
    "entrypoint": "./macros-global",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UnexpectedESMSyntax",
    "entrypoint": "./macros-global",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UnexpectedESMSyntax",
    "entrypoint": "./ref-macros",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UnexpectedESMSyntax",
    "entrypoint": "./ref-macros",
    "resolutionKind": "node16-esm"
  }
]
```