## v0.0.5

- API additions: added `packageVersion` property to `TypedAnalysis` and `UntypedAnalysis` and added `packageName` to `UntypedAnalysis`

## v0.0.4

- New problem kind: **Syntax is incompatible with detected module kind.**

## v0.0.3

- Fixed a bug where 0-byte files in tarballs were interpreted as non-existent.

## v0.0.2

- New problem kind: **Resolved through a fallback condition.**
- Fixed a bug where the ESM/CJS module kind could be inaccurate for `.d.cts`, `.d.mts`, and `.json` files.

## v0.0.1

- Added CHANGELOG
- New problem kind: **CJS module uses a default export.**
- New problem kind: **Types incorrectly use a default export.**
