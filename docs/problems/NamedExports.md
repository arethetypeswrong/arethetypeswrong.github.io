# 🕵️ Named ESM exports

Module advertises named exports which will not exist at runtime.

## Explanation

Static analysis of the distributed **JavaScript** files in this module found that the exports
declared in **TypeScript** do not exist when imported from ESM.

## Consequences

Consumers of this module will run into problems when importing named exports.

```ts
import { utility } from "pkg";
// SyntaxError: The requested module 'pkg' does not provide an export named 'utility'
```

## Common causes

[...]
