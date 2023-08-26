---
"@arethetypeswrong/core": minor
---

Add support for DefinitelyTyped analysis.

- `createPackageFromNpm` now takes an options parameter that can control DefinitelyTyped inclusion.
- The `Package` type is now a class, with new properties and methods:
  - `typesPackage` contains the package name and version for the included DefinitelyTyped package, if any.
  - `mergedWithTypes(typesPackage: Package)` returns a new `Package` instance with all files from both packages and the `typesPackage` instance property metadata filled in.
- `createPackageFromTarballData` is no longer asynchronous.
