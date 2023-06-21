# [arethetypeswrong.github.io](https://arethetypeswrong.github.io)

This project attempts to analyze npm package contents for issues with their TypeScript types, particularly ESM-related module resolution issues. Packages can be explored via the [website](https://arethetypeswrong.github.io) or [CLI](./packages/cli). The following kinds of problems can be detected in the `node10`, `node16`, and `bundler` module resolution modes:

* [💀 Resolution failed](./docs/problems/NoResolution.md)
* [❌ No types](./docs/problems/UntypedResolution.md)
* [🎭 Masquerading as CJS](./docs/problems/FalseCJS.md)
* [👺 Masquerading as ESM](./docs/problems/FalseESM.md)
* [⚠️ ESM (dynamic import only)](./docs/problems/CJSResolvesToESM.md)
* [🐛 Used fallback condition](./docs/problems/FallbackCondition.md)
* [🤨 CJS default export](./docs/problems/CJSOnlyExportsDefault.md)
* [❗️ Incorrect default export](./docs/problems/FalseExportDefault.md)
* [🚭 Unexpected module syntax](./docs/problems/UnexpectedModuleSyntax.md)
* [🥴 Internal resolution error](./docs/problems/InternalResolutionError.md)

## Contributing

Contributions are welcome! Take a look at the open issues or read about [how to contribute to open source](https://opensource.guide).
