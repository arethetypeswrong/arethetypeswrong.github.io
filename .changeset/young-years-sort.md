---
"@arethetypeswrong/core": minor
---

- Refactor internal checks API. This fixes duplication of some problems from the problems array, instead ensuring a single problem instance is visible from each relevant resolution.
- Improve problem type API. Renames many fields on individual problem types.
- Move module kind data off of `EntrypointResolutionAnalysis` and onto a top-level map in `programInfo`, a new top-level field on `Analysis`.
- Remove `Wildcard` problem kind.
