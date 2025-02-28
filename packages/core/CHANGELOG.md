# @arethetypeswrong/core

## 0.17.4

### Patch Changes

- f118862: Use `@loaderkit/resolve` for module resolution

## 0.17.3

### Patch Changes

- e3c775e: Fix CJS resolution infinite loop

## 0.17.2

### Patch Changes

- 59940cd: Exclude array/tuple properties from expected named exports

## 0.17.1

### Patch Changes

- 5f96cdc: Filter `prototype` from expected named exports
- def786e: Fix named exports check crash when resolution is JS-only
- 1bfc877: Fix typo in MissingExportEquals message
- db6464d: Fix minor typos

## 0.17.0

### Minor Changes

- e7ac94c: Add --profile cli option. Example: --profile node16

## 0.16.4

### Patch Changes

- 3ca2866: Fix bug in Named Exports rule that could cause false positives for re-exported values

## 0.16.2

### Patch Changes

- 622b71f: Changed version of lru-cache dependency to ^10.4.3 in order to fix compatibility with Node.js 18.

## 0.16.0

### Minor Changes

- d480f1c: New problem kind: **Named exports cannot be detected by Node.js**. Thanks @laverdet!

### Patch Changes

- 970b141: Update TypeScript and @types/node

## 0.15.1

### Patch Changes

- d93848f: API: distinguish between npm 404s and other thrown errors

## 0.15.0

### Minor Changes

- ab6cd95: add `--entrypoints-legacy` option

## 0.14.1

### Patch Changes

- a8acc95: Add `allowDeprecated` to options accepted by `createPackageFromNpm` API
- e38ed65: Fix false positive MissingExportEquals that can occur when `--moduleResolution bundler` resolves to ESM JS

## 0.14.0

### Minor Changes

- b293c99: Improve detection for MissingExportEquals and FalseExportDefault

## 0.13.9

### Patch Changes

- 66fa67b: Fix extracting some non-compliant tarballs

## 0.13.6

### Patch Changes

- c5923a7: When detecting proxy directories, exclude vendored packages by filtering by package.json name
- 406fc66: Fix bugs in createPackageFromNpm, allow resolveImplementationPackageForTypesPackage to accept a range

## 0.13.5

### Patch Changes

- 34c97d4: Fix TypeScript error for unresolved reference to ts-expose-internals

## 0.13.4

### Patch Changes

- fffff4d: Add tsup to recognized build tools
- 4e7c0dd: Add `resolveImplementationPackageForTypesPackage` util

## 0.13.3

### Patch Changes

- 0055de6: Fix occasional crash
- 8de8306: Add tshy and rspack to build tools list

## 0.13.2

### Patch Changes

- d0ff7c5: Update to TypeScript 5.3

## 0.13.0

### Minor Changes

- acd6e86: Various chores:
  - Drop support for Node.js <=16 (drop `fetch` polyfill)
  - Move to pnpm, update dependencies, add LICENSE files, update READMEs

### Patch Changes

- 3784346: Silence CJSOnlyExportsDefault in `node10`/`node16-cjs`. See [corresponding docs](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/CJSOnlyExportsDefault.md) for explanation.

## 0.12.2

### Patch Changes

- abbb896: Update @andrewbranch/untar.js to fix bug where long filenames could be missing a slash after unpacking, causing false positive resolution errors.

## 0.12.1

### Patch Changes

- 35544c5: Fix crash from missing optional chain

## 0.12.0

### Minor Changes

- a578211:
  - Refactor internal checks API. This fixes duplication of some problems from the problems array, instead ensuring a single problem instance is visible from each relevant resolution.
  - Improve problem type API. Renames many fields on individual problem types.
  - Move module kind data off of `EntrypointResolutionAnalysis` and onto a top-level map in `programInfo`, a new top-level field on `Analysis`.
  - Remove `Wildcard` problem kind.

## 0.10.2

### Patch Changes

- eecbf74: Fix issue with resolving DefinitelyTyped versions

## 0.10.1

### Patch Changes

- ae2426f: Fixed bug that could cause a crash while checking for FalseExportDefault

## 0.10.0

### Minor Changes

- 30bdb07: New problem kind: **Missing `export =`**

  Previously, `FalseExportDefault` had many cases of false positives where the JavaScript assigned an object to `module.exports`, and that object had a `default` property pointing back to itself. This pattern is not a true `FalseExportDefault`, but it is still problematic if the types only declare an `export default`. These kinds of false positives of `FalseExportDefault` are now instead reported as `MissingExportEquals`.

  Additionally, `FalseExportDefault` was only ever reported as being visible in `node16-esm`, but this was incorrect. The consequences are most likely to be visible in `node16-esm`, but the problem is fundamentally independent of the module resolution mode, and inaccuracies can be observed in other modes as well, especially when `esModuleInterop` is not enabled.

## 0.9.0

### Minor Changes

- c3a69f7: Package creation API changes to support @arethetypeswrong/history better. `createPackageFromNpm` options now take a `before` property similar to `npm install --before date`.
- 2c67f2d: Add `buildTools` property to `Analysis` (a pick of `devDependencies`)

## 0.8.0

### Minor Changes

- 894d0f3: Add support for DefinitelyTyped analysis.

  - `createPackageFromNpm` now takes an options parameter that can control DefinitelyTyped inclusion.
  - The `Package` type is now a class, with new properties and methods:
    - `typesPackage` contains the package name and version for the included DefinitelyTyped package, if any.
    - `mergedWithTypes(typesPackage: Package)` returns a new `Package` instance with all files from both packages and the `typesPackage` instance property metadata filled in.
  - `createPackageFromTarballData` is no longer asynchronous.

## 0.7.0

### Minor Changes

- 2c03c4a:
  - Fix a bug in `filterProblems` that caused CJSOnlyExportsDefault not to be identified
  - Change the `kind` property in `filterProblems` to take an array of problem kinds

### Patch Changes

- c8993b9: Fix a false positive of FalseExportDefault on packages that assign both to module.exports and module.exports.default

## 0.6.0

### Minor Changes

- eae544d: Add `options` parameter to `checkPackage` with support for customizing which entrypoints get analyzed.

## 0.5.0

### Minor Changes

- 8b098c0: Changed `checkPackage` signature to accept a package FS as created by new `createPackageFromNpm`, `createPackageFromTarballUrl`, or `createPackageFromTarballData` functions. `createPackageFromNpm` resolves version ranges.

## 0.4.1

### Patch Changes

- 27ad5a7: Expose parsePackageSpec in @arethetypeswrong/core/utils

## 0.3.0

### Minor Changes

- 7c3a377: If a packages has no `exports` field, look for additional entry points marked by extra `package.json` files with a `"main"` field in subdirectories.
- 53e031b: Inlined `InternalResolutionErrorDetails` into `InternalResolutionError` and renamed the interface to `InternalResolutionErrorProblem` to match other problem interfaces

### Patch Changes

- 53e031b: Fixed an issue where InternalResolutionError and UnexpectedModuleSyntax could be duplicated
- 53e031b: Fixed an issue where InternalResolutionError was missing traces

## 0.2.0

### Minor Changes

- 6fc935a: Added links to new documentation for each problem kind

## 0.1.0

### Minor Changes

- d107355:
  - New problem kind: **Internal resolution error** indicates that an import in one of the package’s type declaration files failed to resolve. Either this indicates that runtime resolution errors will occur, or (more likely) the types misrepresent the contents of the JavaScript files.
  - Significant API changes. Most significantly, problems are returned as part of `checkPackage`, and `summarizeProblems`/`getSummarizedProblems` have been replaced by a collection of utilities for grouping and filtering problems.

## 0.0.6

- Fixed an error processing some packages due to different tarball metadata

## 0.0.5

- API additions: added `packageVersion` property to `TypedAnalysis` and `UntypedAnalysis` and added `packageName` to `UntypedAnalysis`

## 0.0.4

- New problem kind: **Syntax is incompatible with detected module kind.**

## 0.0.3

- Fixed a bug where 0-byte files in tarballs were interpreted as non-existent.

## 0.0.2

- New problem kind: **Resolved through a fallback condition.**
- Fixed a bug where the ESM/CJS module kind could be inaccurate for `.d.cts`, `.d.mts`, and `.json` files.

## 0.0.1

- Added CHANGELOG
- New problem kind: **CJS module uses a default export.**
- New problem kind: **Types incorrectly use a default export.**
