# 🥴 Internal resolution error

Import found in a type declaration file failed to resolve. Either this indicates that runtime resolution errors will occur, or (more likely) the types misrepresent the contents of the JavaScript files.

## Explanation

This problem is detected by creating a TypeScript program with a single import of the entrypoint with the given `moduleResolution` setting, letting TypeScript recursively resolve all imports it sees, then visiting each relative or self-name import in every file TypeScript found and inspecting whether it successfully resolved. Since other npm dependencies are not installed, external imports are not analyzed.

## Consequences

* Consumers without `skipLibCheck` enabled will see a TypeScript error reported on declaration files from the package in their node_modules.
* Some exported types may be missing or substituted with `any`.

## Common causes

### Declarations and JavaScript are generated separately

Most commonly, this problem indicates that the type declarations don’t represent the (valid, working) runtime JavaScript. This can happen in combination with “[Masquerading as CJS](./FalseCJS.md)” or “[Masquerading as ESM](./FalseESM.md)” where the types are generated via TypeScript (`tsc` or another tool calling its API) under certain settings, while the JavaScript is generated by another tool entirely, or by TypeScript under different settings. Alternatively, this problem is easy to trigger when hand-authoring type declarations.

### Declarations and JavaScript match, but are not checked with correct settings

This problem can occur with `tsc` alone if the library author compiles with `--moduleResolution node` (also known as `node10`) or `bundler`, especially in combination with a package.json that has `"type": "module"`. Library authors should always compile/check with `--module node16 --moduleResolution node16` or `nodenext` (note that `module` implies the corresponding `moduleResolution` value, but not vice versa), because this is the only TypeScript mode that recognizes Node’s strict module resolution algorithm for ESM.

The problem can also occur when compiling with an unsupported combination of settings, like `--moduleResolution node16 --module esnext`. When either `module` or `moduleResolution` is set to `node16` or `nodenext`, the other setting should always match.

Finally, the problem can occur even when all settings are correct if a package.json is placed into the output directory after a build that changes the module format to/from `"type": "module"`. package.json files affect the detected module format and module resolution, and TypeScript respects the package.json files it sees during compilation in `--moduleResolution node16`. If the set of package.json files that influence the built library are different from the ones TypeScript is aware of during compilation, the results of the compilation can no longer be trusted.
