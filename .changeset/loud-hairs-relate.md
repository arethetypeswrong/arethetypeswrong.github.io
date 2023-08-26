---
"@arethetypeswrong/cli": minor
---

Add support for DefinitelyTyped analysis.

- `@types` packages will be fetched by default for implementation packages that do not contain any TypeScript files.
- `--definitely-typed` can be used to set the version of the `@types` package fetched. By default, the version is inferred from the implementation package version.
- `--no-definitely-typed` can be used to prevent `@types` package inclusion.
