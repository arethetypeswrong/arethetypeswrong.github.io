---
"@arethetypeswrong/cli": patch
---

Fix `--format json` output being truncated when piped and the exit code is non-zero. `write` now waits for stdout to actually flush, and the JSON branch sets `process.exitCode` instead of calling `process.exit`, which could terminate before a buffered pipe drained.
