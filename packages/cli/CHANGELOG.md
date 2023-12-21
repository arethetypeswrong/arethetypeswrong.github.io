# @arethetypeswrong/cli

## 0.13.5

### Patch Changes

- Updated dependencies [34c97d4]
  - @arethetypeswrong/core@0.13.5

## 0.13.4

### Patch Changes

- Updated dependencies [fffff4d]
- Updated dependencies [4e7c0dd]
  - @arethetypeswrong/core@0.13.4

## 0.13.3

### Patch Changes

- 3cc28dc: Fix `--pack` with pre/post scripts that write to STDOUT
- Updated dependencies [0055de6]
- Updated dependencies [8de8306]
  - @arethetypeswrong/core@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [d0ff7c5]
  - @arethetypeswrong/core@0.13.2

## 0.13.1

### Patch Changes

- 6a516c1: Use exit code 3 for errors, 1 for failures

## 0.13.0

### Minor Changes

- acd6e86: Various chores:
  - Drop support for Node.js <=16 (drop `fetch` polyfill)
  - Move to pnpm, update dependencies, add LICENSE files, update READMEs

### Patch Changes

- Updated dependencies [acd6e86]
- Updated dependencies [3784346]
  - @arethetypeswrong/core@0.13.0

## 0.12.2

### Patch Changes

- Updated dependencies [abbb896]
  - @arethetypeswrong/core@0.12.2

## 0.12.1

### Patch Changes

- Updated dependencies [35544c5]
  - @arethetypeswrong/core@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [a578211]
  - @arethetypeswrong/core@0.12.0

## 0.11.0

### Minor Changes

- 26f89d1: Infer `--from-npm` version from a locally-provided DefinitelyTyped package

## 0.10.2

### Patch Changes

- Updated dependencies [eecbf74]
  - @arethetypeswrong/core@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies [ae2426f]
  - @arethetypeswrong/core@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies [30bdb07]
  - @arethetypeswrong/core@0.10.0

## 0.9.0

### Minor Changes

- b2a3251: Report relevant build tools detected in package.json `devDependencies`

### Patch Changes

- Updated dependencies [c3a69f7]
- Updated dependencies [2c67f2d]
  - @arethetypeswrong/core@0.9.0

## 0.8.0

### Minor Changes

- 894d0f3: Add support for DefinitelyTyped analysis.

  - `@types` packages will be fetched by default for implementation packages that do not contain any TypeScript files.
  - `--definitely-typed` can be used to set the version of the `@types` package fetched. By default, the version is inferred from the implementation package version.
  - `--no-definitely-typed` can be used to prevent `@types` package inclusion.

### Patch Changes

- Updated dependencies [894d0f3]
  - @arethetypeswrong/core@0.8.0

## 0.7.1

### Patch Changes

- fe3a6f3: Fix node-fetch dependency missing from @arethetypeswrong/cli

## 0.7.0

### Patch Changes

- Updated dependencies [c8993b9]
- Updated dependencies [2c03c4a]
  - @arethetypeswrong/core@0.7.0

## 0.6.0

### Minor Changes

- 938a2a8: Automatically pick an output format that fits the terminal width (`--format auto`, the new default)
- eae544d: Add `--entrypoints`, `--include-entrypoints`, and `--exclude-entrypoints` options to customize which entrypoints get analyzed.

### Patch Changes

- Updated dependencies [eae544d]
  - @arethetypeswrong/core@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [8b098c0]
  - @arethetypeswrong/core@0.5.0

## 0.4.2

### Patch Changes

- f35407a: Fix crash on Node <v17

## 0.4.1

### Patch Changes

- Updated dependencies [27ad5a7]
  - @arethetypeswrong/core@0.4.1

## 0.4.0

### Minor Changes

- 12014d8: Add --pack flag to support running `npm pack` in a directory and deleting the file afterwards

## 0.3.0

### Patch Changes

- Updated dependencies [53e031b]
- Updated dependencies [53e031b]
- Updated dependencies [7c3a377]
- Updated dependencies [53e031b]
  - @arethetypeswrong/core@0.3.0

## 0.2.0

### Minor Changes

- 6fc935a: Added links to new documentation for each problem kind

### Patch Changes

- Updated dependencies [6fc935a]
  - @arethetypeswrong/core@0.2.0

## 0.1.0

### Minor Changes

- d107355: New problem kind: **Internal resolution error** indicates that an import in one of the package’s type declaration files failed to resolve. Either this indicates that runtime resolution errors will occur, or (more likely) the types misrepresent the contents of the JavaScript files.

### Patch Changes

- Updated dependencies [d107355]
  - @arethetypeswrong/core@0.1.0
