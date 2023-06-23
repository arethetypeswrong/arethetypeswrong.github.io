# @ice__app@3.2.6.tgz

## Problems

```json
[
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": ".",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": "./types",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "NoResolution",
    "entrypoint": "./analyze",
    "resolutionKind": "node10"
  },
  {
    "kind": "CJSResolvesToESM",
    "entrypoint": "./analyze",
    "resolutionKind": "node16-cjs"
  },
  {
    "kind": "InternalResolutionError",
    "resolutionOption": "node16",
    "fileName": "/node_modules/@ice/app/esm/types/userConfig.d.ts",
    "moduleSpecifier": "./plugin",
    "pos": 391,
    "end": 402,
    "resolutionMode": 99,
    "trace": [
      "======== Resolving module './plugin' from '/node_modules/@ice/app/esm/types/userConfig.d.ts'. ========",
      "Explicitly specified module resolution kind: 'Node16'.",
      "Resolving in ESM mode with conditions 'import', 'types', 'node'.",
      "Loading module as file / folder, candidate module location '/node_modules/@ice/app/esm/types/plugin', target file types: TypeScript, JavaScript, Declaration, JSON.",
      "Directory '/node_modules/@ice/app/esm/types/plugin' does not exist, skipping all lookups in it.",
      "======== Module name './plugin' was not resolved. ========"
    ]
  },
  {
    "kind": "InternalResolutionError",
    "resolutionOption": "node16",
    "fileName": "/node_modules/@ice/app/esm/index.d.ts",
    "moduleSpecifier": "./types",
    "pos": 81,
    "end": 91,
    "resolutionMode": 99,
    "trace": [
      "======== Resolving module './types' from '/node_modules/@ice/app/esm/index.d.ts'. ========",
      "Explicitly specified module resolution kind: 'Node16'.",
      "Resolving in ESM mode with conditions 'import', 'types', 'node'.",
      "Loading module as file / folder, candidate module location '/node_modules/@ice/app/esm/types', target file types: TypeScript, JavaScript, Declaration, JSON.",
      "======== Module name './types' was not resolved. ========"
    ]
  }
]
```