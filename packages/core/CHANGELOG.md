# @arethetypeswrong/core

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
