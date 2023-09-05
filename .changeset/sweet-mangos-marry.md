---
"@arethetypeswrong/core": minor
---

New problem kind: **Missing `export =`**

Previously, `FalseExportDefault` had many cases of false positives where the JavaScript assigned an object to `module.exports`, and that object had a `default` property pointing back to itself. This pattern is not a true `FalseExportDefault`, but it is still problematic if the types only declare an `export default`. These kinds of false positives of `FalseExportDefault` are now instead reported as `MissingExportEquals`.

Additionally, `FalseExportDefault` was only ever reported as being visible in `node16-esm`, but this was incorrect. The consequences are most likely to be visible in `node16-esm`, but the problem is fundamentally independent of the module resolution mode, and inaccuracies can be observed in other modes as well, especially when `esModuleInterop` is not enabled.
