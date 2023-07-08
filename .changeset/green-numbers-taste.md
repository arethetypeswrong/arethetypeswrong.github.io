---
"@arethetypeswrong/core": minor
---

Changed `checkPackage` signature to accept a package FS as created by new `createPackageFromNpm`, `createPackageFromTarballUrl`, or `createPackageFromTarballData` functions. `createPackageFromNpm` resolves version ranges.
