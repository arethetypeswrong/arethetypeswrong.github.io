# @arethetypeswrong/core

## 0.1.0

### Minor Changes

- d107355: - New problem kind: **Internal resolution error** indicates that an import in one of the package’s type declaration files failed to resolve. Either this indicates that runtime resolution errors will occur, or (more likely) the types misrepresent the contents of the JavaScript files.
  - Significant API changes. Most significantly, problems are returned as part of `checkPackage`, and `summarizeProblems`/`getSummarizedProblems` have been replaced by a collection of utilities for grouping and filtering problems.
