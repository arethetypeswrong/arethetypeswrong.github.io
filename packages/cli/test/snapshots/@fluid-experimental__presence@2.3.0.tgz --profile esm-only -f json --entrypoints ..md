# @fluid-experimental__presence@2.3.0.tgz --profile esm-only -f json --entrypoints .

```
$ attw @fluid-experimental__presence@2.3.0.tgz --profile esm-only -f json --entrypoints .

{
  "analysis": {
    "packageName": "@fluid-experimental/presence",
    "packageVersion": "2.3.0",
    "types": {
      "kind": "included"
    },
    "buildTools": {
      "@arethetypeswrong/cli": "^0.15.2",
      "typescript": "~5.4.5",
      "@microsoft/api-extractor": "7.47.8"
    },
    "entrypoints": {
      ".": {
        "subpath": ".",
        "resolutions": {
          "node10": {
            "name": ".",
            "resolutionKind": "node10",
            "visibleProblems": [
              0
            ]
          },
          "node16-cjs": {
            "name": ".",
            "resolutionKind": "node16-cjs",
            "resolution": {
              "fileName": "/node_modules/@fluid-experimental/presence/dist/index.d.ts",
              "isJson": false,
              "isTypeScript": true,
              "trace": [
                "======== Resolving module '@fluid-experimental/presence' from '/index.ts'. ========",
                "Explicitly specified module resolution kind: 'Node16'.",
                "Resolving in CJS mode with conditions 'require', 'types', 'node'.",
                "File '/package.json' does not exist.",
                "Loading module '@fluid-experimental/presence' from 'node_modules' folder, target file types: TypeScript, JavaScript, Declaration, JSON.",
                "Searching all ancestor node_modules directories for preferred extensions: TypeScript, Declaration.",
                "Found 'package.json' at '/node_modules/@fluid-experimental/presence/package.json'.",
                "Entering conditional exports.",
                "Saw non-matching condition 'import'.",
                "Matched 'exports' condition 'require'.",
                "Entering conditional exports.",
                "Matched 'exports' condition 'types'.",
                "Using 'exports' subpath '.' with target './dist/index.d.ts'.",
                "File '/node_modules/@fluid-experimental/presence/dist/index.d.ts' exists - use it as a name resolution result.",
                "'package.json' does not have a 'peerDependencies' field.",
                "Resolved under condition 'types'.",
                "Exiting conditional exports.",
                "Resolved under condition 'require'.",
                "Exiting conditional exports.",
                "======== Module name '@fluid-experimental/presence' was successfully resolved to '/node_modules/@fluid-experimental/presence/dist/index.d.ts' with Package ID '@fluid-experimental/presence/dist/index.d.ts@2.3.0'. ========"
              ]
            },
            "implementationResolution": {
              "fileName": "/node_modules/@fluid-experimental/presence/dist/index.js",
              "isJson": false,
              "isTypeScript": false,
              "trace": [
                "======== Resolving module '@fluid-experimental/presence' from '/index.ts'. ========",
                "Explicitly specified module resolution kind: 'Node16'.",
                "Resolving in CJS mode with conditions 'require', 'node'.",
                "File '/package.json' does not exist.",
                "Loading module '@fluid-experimental/presence' from 'node_modules' folder, target file types: TypeScript, JavaScript, JSON.",
                "Searching all ancestor node_modules directories for preferred extensions: TypeScript.",
                "Found 'package.json' at '/node_modules/@fluid-experimental/presence/package.json'.",
                "Entering conditional exports.",
                "Saw non-matching condition 'import'.",
                "Matched 'exports' condition 'require'.",
                "Entering conditional exports.",
                "Saw non-matching condition 'types'.",
                "Matched 'exports' condition 'default'.",
                "Using 'exports' subpath '.' with target './dist/index.js'.",
                "File name '/node_modules/@fluid-experimental/presence/dist/index.js' has a '.js' extension - stripping it.",
                "File '/node_modules/@fluid-experimental/presence/dist/index.ts' does not exist.",
                "File '/node_modules/@fluid-experimental/presence/dist/index.tsx' does not exist.",
                "Failed to resolve under condition 'default'.",
                "Exiting conditional exports.",
                "Failed to resolve under condition 'require'.",
                "Exiting conditional exports.",
                "Searching all ancestor node_modules directories for fallback extensions: JavaScript, JSON.",
                "File '/node_modules/@fluid-experimental/presence/package.json' exists according to earlier cached lookups.",
                "Entering conditional exports.",
                "Saw non-matching condition 'import'.",
                "Matched 'exports' condition 'require'.",
                "Entering conditional exports.",
                "Saw non-matching condition 'types'.",
                "Matched 'exports' condition 'default'.",
                "Using 'exports' subpath '.' with target './dist/index.js'.",
                "File name '/node_modules/@fluid-experimental/presence/dist/index.js' has a '.js' extension - stripping it.",
                "File '/node_modules/@fluid-experimental/presence/dist/index.js' exists - use it as a name resolution result.",
                "'package.json' does not have a 'peerDependencies' field.",
                "Resolved under condition 'default'.",
                "Exiting conditional exports.",
                "Resolved under condition 'require'.",
                "Exiting conditional exports.",
                "======== Module name '@fluid-experimental/presence' was successfully resolved to '/node_modules/@fluid-experimental/presence/dist/index.js' with Package ID '@fluid-experimental/presence/dist/index.js@2.3.0'. ========"
              ]
            },
            "files": [
              "/node_modules/typescript/lib/lib.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/baseTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/events/events.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/presence.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/core-interfaces/jsonSerializationErrors.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/core-interfaces/jsonType.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/core-interfaces/exposedUtilityTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/core-interfaces/jsonDeserialized.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/core-interfaces/jsonSerializable.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/core-interfaces/index.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/exposedInternalTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/exposedUtilityTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/notificationsManager.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/types.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/container-definitions/containerExtensions.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/container-definitions/runtime.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/container-definitions/index.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/experimentalAccess.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/datastorePresenceManagerFactory.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/latestValueControls.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/latestValueTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/latestMapValueManager.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/latestValueManager.d.ts",
              "/node_modules/@fluid-experimental/presence/dist/index.d.ts"
            ],
            "visibleProblems": []
          },
          "node16-esm": {
            "name": ".",
            "resolutionKind": "node16-esm",
            "resolution": {
              "fileName": "/node_modules/@fluid-experimental/presence/lib/index.d.ts",
              "isJson": false,
              "isTypeScript": true,
              "trace": [
                "======== Resolving module '@fluid-experimental/presence' from '/index.mts'. ========",
                "Explicitly specified module resolution kind: 'Node16'.",
                "Resolving in ESM mode with conditions 'import', 'types', 'node'.",
                "File '/package.json' does not exist according to earlier cached lookups.",
                "Loading module '@fluid-experimental/presence' from 'node_modules' folder, target file types: TypeScript, JavaScript, Declaration, JSON.",
                "Searching all ancestor node_modules directories for preferred extensions: TypeScript, Declaration.",
                "File '/node_modules/@fluid-experimental/presence/package.json' exists according to earlier cached lookups.",
                "Entering conditional exports.",
                "Matched 'exports' condition 'import'.",
                "Entering conditional exports.",
                "Matched 'exports' condition 'types'.",
                "Using 'exports' subpath '.' with target './lib/index.d.ts'.",
                "File '/node_modules/@fluid-experimental/presence/lib/index.d.ts' exists - use it as a name resolution result.",
                "Resolved under condition 'types'.",
                "Exiting conditional exports.",
                "Resolved under condition 'import'.",
                "Exiting conditional exports.",
                "======== Module name '@fluid-experimental/presence' was successfully resolved to '/node_modules/@fluid-experimental/presence/lib/index.d.ts' with Package ID '@fluid-experimental/presence/lib/index.d.ts@2.3.0'. ========"
              ]
            },
            "implementationResolution": {
              "fileName": "/node_modules/@fluid-experimental/presence/lib/index.js",
              "isJson": false,
              "isTypeScript": false,
              "trace": [
                "======== Resolving module '@fluid-experimental/presence' from '/index.mts'. ========",
                "Explicitly specified module resolution kind: 'Node16'.",
                "Resolving in ESM mode with conditions 'import', 'node'.",
                "File '/package.json' does not exist according to earlier cached lookups.",
                "Loading module '@fluid-experimental/presence' from 'node_modules' folder, target file types: TypeScript, JavaScript, JSON.",
                "Searching all ancestor node_modules directories for preferred extensions: TypeScript.",
                "File '/node_modules/@fluid-experimental/presence/package.json' exists according to earlier cached lookups.",
                "Entering conditional exports.",
                "Matched 'exports' condition 'import'.",
                "Entering conditional exports.",
                "Saw non-matching condition 'types'.",
                "Matched 'exports' condition 'default'.",
                "Using 'exports' subpath '.' with target './lib/index.js'.",
                "File name '/node_modules/@fluid-experimental/presence/lib/index.js' has a '.js' extension - stripping it.",
                "File '/node_modules/@fluid-experimental/presence/lib/index.ts' does not exist.",
                "File '/node_modules/@fluid-experimental/presence/lib/index.tsx' does not exist.",
                "Failed to resolve under condition 'default'.",
                "Exiting conditional exports.",
                "Failed to resolve under condition 'import'.",
                "Saw non-matching condition 'require'.",
                "Exiting conditional exports.",
                "Searching all ancestor node_modules directories for fallback extensions: JavaScript, JSON.",
                "File '/node_modules/@fluid-experimental/presence/package.json' exists according to earlier cached lookups.",
                "Entering conditional exports.",
                "Matched 'exports' condition 'import'.",
                "Entering conditional exports.",
                "Saw non-matching condition 'types'.",
                "Matched 'exports' condition 'default'.",
                "Using 'exports' subpath '.' with target './lib/index.js'.",
                "File name '/node_modules/@fluid-experimental/presence/lib/index.js' has a '.js' extension - stripping it.",
                "File '/node_modules/@fluid-experimental/presence/lib/index.js' exists - use it as a name resolution result.",
                "Resolved under condition 'default'.",
                "Exiting conditional exports.",
                "Resolved under condition 'import'.",
                "Exiting conditional exports.",
                "Resolution of non-relative name failed; trying with modern Node resolution features disabled to see if npm library needs configuration update.",
                "File '/package.json' does not exist according to earlier cached lookups.",
                "Loading module '@fluid-experimental/presence' from 'node_modules' folder, target file types: TypeScript.",
                "Searching all ancestor node_modules directories for preferred extensions: TypeScript.",
                "File '/node_modules/@fluid-experimental/presence/package.json' exists according to earlier cached lookups.",
                "'package.json' does not have a 'typesVersions' field.",
                "'package.json' does not have a 'main' field.",
                "======== Module name '@fluid-experimental/presence' was successfully resolved to '/node_modules/@fluid-experimental/presence/lib/index.js' with Package ID '@fluid-experimental/presence/lib/index.js@2.3.0'. ========"
              ]
            },
            "files": [
              "/node_modules/typescript/lib/lib.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/baseTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/events/events.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/presence.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/core-interfaces/jsonSerializationErrors.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/core-interfaces/jsonType.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/core-interfaces/exposedUtilityTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/core-interfaces/jsonDeserialized.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/core-interfaces/jsonSerializable.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/core-interfaces/index.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/exposedInternalTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/exposedUtilityTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/notificationsManager.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/types.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/container-definitions/containerExtensions.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/container-definitions/runtime.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/container-definitions/index.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/experimentalAccess.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/datastorePresenceManagerFactory.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/latestValueControls.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/latestValueTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/latestMapValueManager.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/latestValueManager.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/index.d.ts"
            ],
            "visibleProblems": []
          },
          "bundler": {
            "name": ".",
            "resolutionKind": "bundler",
            "resolution": {
              "fileName": "/node_modules/@fluid-experimental/presence/lib/index.d.ts",
              "isJson": false,
              "isTypeScript": true,
              "trace": [
                "======== Resolving module '@fluid-experimental/presence' from '/index.ts'. ========",
                "Explicitly specified module resolution kind: 'Bundler'.",
                "Resolving in CJS mode with conditions 'import', 'types'.",
                "File '/package.json' does not exist.",
                "Loading module '@fluid-experimental/presence' from 'node_modules' folder, target file types: TypeScript, JavaScript, Declaration, JSON.",
                "Searching all ancestor node_modules directories for preferred extensions: TypeScript, Declaration.",
                "Found 'package.json' at '/node_modules/@fluid-experimental/presence/package.json'.",
                "Entering conditional exports.",
                "Matched 'exports' condition 'import'.",
                "Entering conditional exports.",
                "Matched 'exports' condition 'types'.",
                "Using 'exports' subpath '.' with target './lib/index.d.ts'.",
                "File '/node_modules/@fluid-experimental/presence/lib/index.d.ts' exists - use it as a name resolution result.",
                "'package.json' does not have a 'peerDependencies' field.",
                "Resolved under condition 'types'.",
                "Exiting conditional exports.",
                "Resolved under condition 'import'.",
                "Exiting conditional exports.",
                "======== Module name '@fluid-experimental/presence' was successfully resolved to '/node_modules/@fluid-experimental/presence/lib/index.d.ts' with Package ID '@fluid-experimental/presence/lib/index.d.ts@2.3.0'. ========"
              ]
            },
            "implementationResolution": {
              "fileName": "/node_modules/@fluid-experimental/presence/lib/index.js",
              "isJson": false,
              "isTypeScript": false,
              "trace": [
                "======== Resolving module '@fluid-experimental/presence' from '/index.ts'. ========",
                "Explicitly specified module resolution kind: 'Bundler'.",
                "Resolving in CJS mode with conditions 'import'.",
                "File '/package.json' does not exist.",
                "Loading module '@fluid-experimental/presence' from 'node_modules' folder, target file types: TypeScript, JavaScript, JSON.",
                "Searching all ancestor node_modules directories for preferred extensions: TypeScript.",
                "Found 'package.json' at '/node_modules/@fluid-experimental/presence/package.json'.",
                "Entering conditional exports.",
                "Matched 'exports' condition 'import'.",
                "Entering conditional exports.",
                "Saw non-matching condition 'types'.",
                "Matched 'exports' condition 'default'.",
                "Using 'exports' subpath '.' with target './lib/index.js'.",
                "File name '/node_modules/@fluid-experimental/presence/lib/index.js' has a '.js' extension - stripping it.",
                "File '/node_modules/@fluid-experimental/presence/lib/index.ts' does not exist.",
                "File '/node_modules/@fluid-experimental/presence/lib/index.tsx' does not exist.",
                "Failed to resolve under condition 'default'.",
                "Exiting conditional exports.",
                "Failed to resolve under condition 'import'.",
                "Saw non-matching condition 'require'.",
                "Exiting conditional exports.",
                "Searching all ancestor node_modules directories for fallback extensions: JavaScript, JSON.",
                "File '/node_modules/@fluid-experimental/presence/package.json' exists according to earlier cached lookups.",
                "Entering conditional exports.",
                "Matched 'exports' condition 'import'.",
                "Entering conditional exports.",
                "Saw non-matching condition 'types'.",
                "Matched 'exports' condition 'default'.",
                "Using 'exports' subpath '.' with target './lib/index.js'.",
                "File name '/node_modules/@fluid-experimental/presence/lib/index.js' has a '.js' extension - stripping it.",
                "File '/node_modules/@fluid-experimental/presence/lib/index.js' exists - use it as a name resolution result.",
                "'package.json' does not have a 'peerDependencies' field.",
                "Resolved under condition 'default'.",
                "Exiting conditional exports.",
                "Resolved under condition 'import'.",
                "Exiting conditional exports.",
                "Resolution of non-relative name failed; trying with modern Node resolution features disabled to see if npm library needs configuration update.",
                "File '/package.json' does not exist according to earlier cached lookups.",
                "Loading module '@fluid-experimental/presence' from 'node_modules' folder, target file types: TypeScript.",
                "Searching all ancestor node_modules directories for preferred extensions: TypeScript.",
                "File '/node_modules/@fluid-experimental/presence/package.json' exists according to earlier cached lookups.",
                "File '/node_modules/@fluid-experimental/presence.ts' does not exist.",
                "File '/node_modules/@fluid-experimental/presence.tsx' does not exist.",
                "'package.json' does not have a 'typesVersions' field.",
                "'package.json' does not have a 'main' field.",
                "File '/node_modules/@fluid-experimental/presence/index.ts' does not exist.",
                "File '/node_modules/@fluid-experimental/presence/index.tsx' does not exist.",
                "======== Module name '@fluid-experimental/presence' was successfully resolved to '/node_modules/@fluid-experimental/presence/lib/index.js' with Package ID '@fluid-experimental/presence/lib/index.js@2.3.0'. ========"
              ]
            },
            "files": [
              "/node_modules/typescript/lib/lib.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/baseTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/events/events.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/presence.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/core-interfaces/jsonSerializationErrors.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/core-interfaces/jsonType.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/core-interfaces/exposedUtilityTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/core-interfaces/jsonDeserialized.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/core-interfaces/jsonSerializable.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/core-interfaces/index.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/exposedInternalTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/exposedUtilityTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/notificationsManager.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/types.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/container-definitions/containerExtensions.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/container-definitions/runtime.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/container-definitions/index.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/experimentalAccess.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/datastorePresenceManagerFactory.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/latestValueControls.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/latestValueTypes.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/latestMapValueManager.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/latestValueManager.d.ts",
              "/node_modules/@fluid-experimental/presence/lib/index.d.ts"
            ],
            "visibleProblems": []
          }
        },
        "hasTypes": true,
        "isWildcard": false
      }
    },
    "programInfo": {
      "node10": {},
      "node16": {
        "moduleKinds": {
          "/node_modules/typescript/lib/lib.d.ts": {
            "detectedKind": 1,
            "detectedReason": "no:type",
            "reasonFileName": "/node_modules/typescript/lib/lib.d.ts"
          },
          "/node_modules/@fluid-experimental/presence/dist/baseTypes.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/events/events.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/presence.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/core-interfaces/jsonSerializationErrors.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/core-interfaces/jsonType.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/core-interfaces/exposedUtilityTypes.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/core-interfaces/jsonDeserialized.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/core-interfaces/jsonSerializable.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/core-interfaces/index.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/exposedInternalTypes.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/exposedUtilityTypes.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/notificationsManager.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/types.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/container-definitions/containerExtensions.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/container-definitions/runtime.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/container-definitions/index.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/experimentalAccess.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/datastorePresenceManagerFactory.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/latestValueControls.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/latestValueTypes.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/latestMapValueManager.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/latestValueManager.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/index.d.ts": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/dist/index.js": {
            "detectedKind": 1,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/dist/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/baseTypes.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/events/events.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/presence.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/core-interfaces/jsonSerializationErrors.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/core-interfaces/jsonType.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/core-interfaces/exposedUtilityTypes.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/core-interfaces/jsonDeserialized.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/core-interfaces/jsonSerializable.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/core-interfaces/index.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/exposedInternalTypes.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/exposedUtilityTypes.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/notificationsManager.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/types.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/container-definitions/containerExtensions.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/container-definitions/runtime.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/container-definitions/index.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/experimentalAccess.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/datastorePresenceManagerFactory.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/latestValueControls.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/latestValueTypes.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/latestMapValueManager.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/latestValueManager.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/index.d.ts": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          },
          "/node_modules/@fluid-experimental/presence/lib/index.js": {
            "detectedKind": 99,
            "detectedReason": "type",
            "reasonFileName": "/node_modules/@fluid-experimental/presence/package.json"
          }
        }
      },
      "bundler": {}
    },
    "problems": [
      {
        "kind": "NoResolution",
        "entrypoint": ".",
        "resolutionKind": "node10"
      }
    ]
  },
  "problems": {
    "NoResolution": [
      {
        "kind": "NoResolution",
        "entrypoint": ".",
        "resolutionKind": "node10"
      }
    ]
  }
}


```

Exit code: 0