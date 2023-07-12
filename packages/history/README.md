# @arethetypeswrong/history

This package provides `@arethetypeswrong/core` analysis for every [npm-high-impact](https://github.com/wooorm/npm-high-impact) package at the latest version available on the first of every month since January 2022.

The analysis is saved as a 1.2 GB newline-delimited JSON file, cached in Azure Storage for incremental updates going forward, compressed down to 34 MB for shipping to npm, and accessible in Node as a JavaScript object via a small programmatic interface.

## Usage

```ts
import { getAllDataAsObject, getVersionsByDate } from "@arethetypeswrong/history";

const dates = await getVersionsByDate();
const data = await getAllDataAsObject();

function getPackagesWithFalseCJSProblems(date) {
  const packages = dates[date];
  const result = [];
  for (const { packageName, packageVersion } of packages) {
    const analysis = data[`${packageName}@${packageVersion}`];
    // `analysis` is undefined if the package doesn't contain types
    if (analysis?.problems.some((p) => p.kind === "FalseESM")) {
      result.push(analysis);
    }
  }
  return result;
}

const mayFalseESMProblems = getPackagesWithFalseCJSProblems("2023-05-01").length;
const juneFalseESMProblems = getPackagesWithFalseCJSProblems("2023-06-01").length;
console.log({ mayFalseESMProblems, juneFalseESMProblems });
```
