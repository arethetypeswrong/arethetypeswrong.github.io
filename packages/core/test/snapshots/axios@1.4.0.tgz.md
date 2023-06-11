# axios@1.4.0.tgz

## Summary

```json
[
  {
    "kind": "Wildcard",
    "title": "Wildcards",
    "messages": [
      {
        "messageText": "Wildcards cannot yet be analyzed by this tool.",
        "messageHtml": "Wildcards cannot yet be analyzed by this tool."
      }
    ]
  },
  {
    "kind": "NoResolution",
    "title": "Resolution failed",
    "messages": [
      {
        "messageText": "Imports of multiple entrypoints under the `node10` module resolution setting failed to resolve.",
        "messageHtml": "Imports of <strong>multiple entrypoints</strong> under the <code>node10</code> module resolution setting failed to resolve."
      }
    ]
  },
  {
    "kind": "UntypedResolution",
    "title": "Could not find types",
    "messages": [
      {
        "messageText": "Imports of multiple entrypoints under the `node16` module resolution setting when the importing module is CJS (its extension is `.cts` or `.cjs`, or it has a `.ts` or `.js` extension and is in scope of a `package.json` that does not contain `\"type\": \"module\"`) resolved to JavaScript files, but no types.",
        "messageHtml": "Imports of <strong>multiple entrypoints</strong> under the <code>node16</code> module resolution setting when the importing module is CJS (its extension is <code>.cts</code> or <code>.cjs</code>, or it has a <code>.ts</code> or <code>.js</code> extension and is in scope of a <code>package.json</code> that does not contain <code>\"type\": \"module\"</code>) resolved to JavaScript files, but no types."
      },
      {
        "messageText": "Imports of multiple entrypoints under the `node16` module resolution setting when the importing module is ESM (its extension is `.mts` or `.mjs`, or it has a `.ts` or `.js` extension and is in scope of a `package.json` that contains `\"type\": \"module\"`) resolved to JavaScript files, but no types.",
        "messageHtml": "Imports of <strong>multiple entrypoints</strong> under the <code>node16</code> module resolution setting when the importing module is ESM (its extension is <code>.mts</code> or <code>.mjs</code>, or it has a <code>.ts</code> or <code>.js</code> extension and is in scope of a <code>package.json</code> that contains <code>\"type\": \"module\"</code>) resolved to JavaScript files, but no types."
      },
      {
        "messageText": "Imports of multiple entrypoints under the `bundler` module resolution setting resolved to JavaScript files, but no types.",
        "messageHtml": "Imports of <strong>multiple entrypoints</strong> under the <code>bundler</code> module resolution setting resolved to JavaScript files, but no types."
      }
    ]
  },
  {
    "kind": "CJSResolvesToESM",
    "title": "Entrypoint is ESM-only",
    "messages": [
      {
        "messageText": "Imports of multiple entrypoints resolved to ES modules from a CJS importing module. CJS modules in Node will only be able to access this entrypoint with a dynamic import.",
        "messageHtml": "Imports of <strong>multiple entrypoints</strong> resolved to ES modules from a CJS importing module. CJS modules in Node will only be able to access this entrypoint with a dynamic import."
      }
    ]
  }
]
```

## Problems

```json
[
  {
    "kind": "Wildcard",
    "entrypoint": "./unsafe/*",
    "resolutionKind": "node10"
  },
  {
    "kind": "Wildcard",
    "entrypoint": "./unsafe/*",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "Wildcard",
    "entrypoint": "./unsafe/*",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "Wildcard",
    "entrypoint": "./unsafe/*",
    "resolutionKind": "bundler"
  },
  {
    "kind": "NoResolution",
    "entrypoint": "./unsafe/core/settle.js",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/core/settle.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": "./unsafe/core/settle.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/core/settle.js",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/core/settle.js",
    "resolutionKind": "bundler"
  },
  {
    "kind": "NoResolution",
    "entrypoint": "./unsafe/core/buildFullPath.js",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/core/buildFullPath.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": "./unsafe/core/buildFullPath.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/core/buildFullPath.js",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/core/buildFullPath.js",
    "resolutionKind": "bundler"
  },
  {
    "kind": "NoResolution",
    "entrypoint": "./unsafe/helpers/isAbsoluteURL.js",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/helpers/isAbsoluteURL.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": "./unsafe/helpers/isAbsoluteURL.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/helpers/isAbsoluteURL.js",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/helpers/isAbsoluteURL.js",
    "resolutionKind": "bundler"
  },
  {
    "kind": "NoResolution",
    "entrypoint": "./unsafe/helpers/buildURL.js",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/helpers/buildURL.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": "./unsafe/helpers/buildURL.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/helpers/buildURL.js",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/helpers/buildURL.js",
    "resolutionKind": "bundler"
  },
  {
    "kind": "NoResolution",
    "entrypoint": "./unsafe/helpers/combineURLs.js",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/helpers/combineURLs.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": "./unsafe/helpers/combineURLs.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/helpers/combineURLs.js",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/helpers/combineURLs.js",
    "resolutionKind": "bundler"
  },
  {
    "kind": "NoResolution",
    "entrypoint": "./unsafe/adapters/http.js",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/adapters/http.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": "./unsafe/adapters/http.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/adapters/http.js",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/adapters/http.js",
    "resolutionKind": "bundler"
  },
  {
    "kind": "NoResolution",
    "entrypoint": "./unsafe/adapters/xhr.js",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/adapters/xhr.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": "./unsafe/adapters/xhr.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/adapters/xhr.js",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/adapters/xhr.js",
    "resolutionKind": "bundler"
  },
  {
    "kind": "NoResolution",
    "entrypoint": "./unsafe/utils.js",
    "resolutionKind": "node10"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/utils.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": "./unsafe/utils.js",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/utils.js",
    "resolutionKind": "node16-esm"
  },
  {
    "kind": "UntypedResolution",
    "entrypoint": "./unsafe/utils.js",
    "resolutionKind": "bundler"
  }
]
```