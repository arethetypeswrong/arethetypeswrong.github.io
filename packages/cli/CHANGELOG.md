# @arethetypeswrong/cli

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
