# commander@10.0.1.tgz

## Summary

```json
[
  {
    "kind": "FalseCJS",
    "title": "Types are CJS, but implementation is ESM",
    "messages": [
      {
        "messageText": "Imports of `\"commander\"` under the `node16` module resolution setting when the importing module is ESM (its extension is `.mts` or `.mjs`, or it has a `.ts` or `.js` extension and is in scope of a `package.json` that contains `\"type\": \"module\"`) resolved to CJS types, but ESM implementations.",
        "messageHtml": "Imports of <code>\"commander\"</code> under the <code>node16</code> module resolution setting when the importing module is ESM (its extension is <code>.mts</code> or <code>.mjs</code>, or it has a <code>.ts</code> or <code>.js</code> extension and is in scope of a <code>package.json</code> that contains <code>\"type\": \"module\"</code>) resolved to CJS types, but ESM implementations."
      }
    ]
  },
  {
    "kind": "UntypedResolution",
    "title": "Could not find types",
    "messages": [
      {
        "messageText": "Imports of `\"commander/esm.mjs\"` under all module resolution settings resolved to JavaScript files, but no types.",
        "messageHtml": "Imports of <code>\"commander/esm.mjs\"</code> under <strong>all module resolution settings</strong> resolved to JavaScript files, but no types."
      }
    ]
  },
  {
    "kind": "CJSResolvesToESM",
    "title": "Entrypoint is ESM-only",
    "messages": [
      {
        "messageText": "Imports of `\"commander/esm.mjs\"` resolved to ES modules from a CJS importing module. CJS modules in Node will only be able to access this entrypoint with a dynamic import.",
        "messageHtml": "Imports of <code>\"commander/esm.mjs\"</code> resolved to ES modules from a CJS importing module. CJS modules in Node will only be able to access this entrypoint with a dynamic import."
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
    "kind": "UntypedResolution",
    "entrypoint": "./esm.mjs",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./esm.mjs",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": "./esm.mjs",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./esm.mjs",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./esm.mjs",
    "resolutionKind": "bundler"
  }
]
```