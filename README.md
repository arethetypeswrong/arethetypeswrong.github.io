# [arethetypeswrong.github.io](https://arethetypeswrong.github.io)

This project attempts to analyze npm package contents for issues with their TypeScript types, particularly ESM-related module resolution issues. Currently, the following kinds of problems can be detected in the `node10`, `node16`, and `bundler` module resolution modes:

- **The package doesn’t ship types.** In the future, the tool may pull typings from DefinitelyTyped and check for agreement ([dts-critic](https://github.com/microsoft/DefinitelyTyped-tools/tree/master/packages/dts-critic) is prior art).
- **Resolution failed.** Occurs when an import of the package (or a package subpath defined in its package.json `exports`) fails to resolve completely. This will result in a TypeScript compiler error, and may indicate that the runtime corresponding to the module resolution mode tested might fail to resolve it too.
- **Untyped resolution.** Occurs when TypeScript can resolve a JavaScript file, but no type declaration file. This is a TypeScript compiler error under `noImplicitAny`.
- **Types are CJS, but implementation is ESM.** In the `node16` resolution mode, TypeScript detects whether Node itself will assume a file is a CommonJS or ECMAScript module. If the types resolved are detected to be CJS, but the JavaScript resolved is detected to be ESM, this problem is raised. It is often caused by a dependency’s package.json doing something like:
  ```json
  {
    "exports": {
      "types": "./index.d.ts",
      "import": "./index.mjs",
      "require": "./index.js"
    }
  }
  ```
  Because there is no `"type": "module"` setting here, the `.js` and `.d.ts` file will always be interpreted as a CommonJS module. But if the _importing_ file is an ES module, the runtime will resolve to the `.mjs` file, which is unambiguously ESM. In this case, the module kind of the types misrepresents the runtime-resolved module. This tends to present the most issues for users when default exports are used. In the future, this tool may detect whether an `export default` might make this problem more severe and give a full explanation of why. In the meantime, you can read the explanation in [this issue](https://github.com/microsoft/TypeScript/issues/50058#issuecomment-1404411380). The simple fix for the example above would be to add an `index.d.mts` file dedicated to typing the `.mjs` module, and remove the `"types"` condition.
- **Types are ESM, but implementation is CJS.** The reverse of the above, but with worse consequences. Because a CommonJS module cannot access an ES module without (async) dynamic import, this kind of mismatch means that TypeScript will _falsely_ belive that a CJS module is unable to import the package without dynamic import. This is more rare, but can happen with a similar situation as the above, but where the package.json has `"type": "module"`, and the importing file is a CJS module.
- **Syntax is incompatible with detected module kind.** In Node, as well as in some bundlers, whether a file should be interpreted as CJS or ESM is a pure function of the file extension and the nearest ancestor package.json `type`. If these signal that the file is ESM, `module` and `require` will be `undefined`. If they signal that the file is CJS, `import` and `export` statements will be syntax errors. This problem is raised when syntax incompatible with the detected module kind is used.
- **Package (or subpath) is ESM-only.** This occurs when a CommonJS importing module in `node16` resolves to an ES module (and not falsely so, as above, as far as we can tell). This is a TypeScript compiler error and will be a runtime error in Node. It’s not necessarily a defect of the package; it likely just means that the author decided to only publish ESM, leaving their CommonJS consumers without a good option.
- **Resolved through a fallback condition.** In Node, when resolution of an import path hits conditional `"exports"` in a package.json, it tries to resolve with the first matching condition. If resolution fails with that condition, the process is over and the import is not resolved. TypeScript’s algorithm instead continues through the list of conditions and attempts to resolve with any other condition that matches, until resolution succeeds or the no more conditions match. This is [a TypeScript bug](https://github.com/microsoft/TypeScript/issues/50762), so its behavior should not be relied upon—even if the bug never gets fixed, results that arise from it are likely to be innacurate since the resolution process diverges from Node.
- **CJS module uses a default export.** CommonJS files can indicate to bundlers that a default import should resolve to its `module.exports.default` instead of its `module.exports` by setting `module.exports.__esModule` to `true`. Node does not respect the `__esModule` marker, though, so default imports of the file in Node will have to add an additional `.default` property access in order to get to the file’s intended default export:
  ```ts
  // main.mts:
  import doSomething from "dependency";
  doSomething(); // doesn't work
  doSomething.default(); // works
  ```
  This problem is reported when a CJS module appears to use `module.exports.default`, has an `__esModule` marker, and its types use `export default`. It’s important to notice that in this case, the types and the implementation agree. Adding a `.default` is necessary, both to run in Node and to satisfy the TypeScript compiler. There are no inconsistencies here, but the pattern is discouraged since the code needed to use the import in a bundler and the code needed in Node are mutually incompatible. Instead, the library is encouraged to use `module.exports` instead of, or in addition to, `module.exports.default`. So no, the types aren’t wrong, but the package likely isn’t functioning in Node like they intended.
- **Types incorrectly use a default export.** This happens when a CJS file uses `module.exports =` but its types use `export default`. The correct type declaration for `module.exports = ...` is `export = ...`. This mismatch doesn’t usually present a problem in bundlers, but for Node, TypeScript will falsely think a default import from an ESM file needs an additional `.default`, as in the example from the previous problem.

## Future work

The first things on my roadmap:

- More thorough explanations of problems
- Support for DefinitelyTyped analysis
- Official TypeScript module documentation to link to

Some other ideas:

- Use unpkg or something so it uses less data
- Generate a downloadable reproduction of a problem
- Analyze traces and failed lookup locations to suggest fixes

## Contributing

- Understanding that the site is rather incomplete, issue reports are ok.
- I’m open to someone with design chops adding some styles, but I want to keep it simple. Reach out in an issue.
