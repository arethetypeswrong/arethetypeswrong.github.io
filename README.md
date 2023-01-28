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
- **Package (or subpath) is ESM-only.** This occurs when a CommonJS importing module in `node16` resolves to an ES module (and not falsely so, as above, as far as we can tell). This is a TypeScript compiler error and will be a runtime error in Node. It’s not necessarily a defect of the package; it likely just means that the author decided to only publish ESM, leaving their CommonJS consumers without a good option.

## Future work

The first things on my roadmap:

- More thorough explanations of problems
- List affected subpaths and module resolution modes
- Detect `export default` issues
- Analyze a local tarball from `npm pack`
- Official TypeScript module documentation to link to

Some other ideas:

- Use unpkg or something so it uses less data
- Generate a downloadable reproduction of a problem
- Suggest more solutions

## Contributing

- Understanding that the site is rather incomplete, issue reports are ok.
- I’m open to someone with design chops adding some styles, but I want to keep it simple. Reach out in an issue.
