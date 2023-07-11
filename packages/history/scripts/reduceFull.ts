// import { allProblemKinds, filterProblems } from "@arethetypeswrong/core/problems";
// import { readFile, writeFile } from "fs/promises";
// import type { DatesJson, FullJson, FullTypedRootJson, RootProblemCountsByDateJson } from "./types.ts";

// const emptyArray = [] as const;
// const fullJsonFileName = new URL("../data/full.json", import.meta.url);
// const dates: DatesJson = JSON.parse(await readFile(new URL("../data/dates.json", import.meta.url), "utf8"));

// // This will eventually break when full.json gets too big.
// const fullJson: FullJson = JSON.parse(await readFile(fullJsonFileName, "utf8"));

// // rootProblemCountsByDate.json
// const rootProblemCountsByDateFileName = new URL("../data/rootProblemCountsByDate.json", import.meta.url);
// const rootProblemCountsByDate: RootProblemCountsByDateJson = {
//   problemKinds: allProblemKinds,
//   dates: Object.fromEntries(
//     Object.keys(dates.dates).map((date) => {
//       const problemCounts = allProblemKinds.map(() => 0);
//       const versions = dates.dates[date];
//       let typedPackages = 0;
//       for (const { packageName, packageVersion } of versions) {
//         const key = `${packageName}@${packageVersion}`;
//         const result = fullTypedRoots[key];
//         if (!result) {
//           continue;
//         }
//         typedPackages++;
//         // Only count 1 per problem kind per package.
//         for (let index = 0; index < problemCounts.length; index++) {
//           if (result.analysis.problems.some((problem) => problem.kind === allProblemKinds[index])) {
//             problemCounts[index]++;
//           }
//         }
//       }
//       return [
//         date,
//         {
//           problems: problemCounts,
//           typedPackages,
//         },
//       ];
//     })
//   ),
// };
// await writeFile(rootProblemCountsByDateFileName, JSON.stringify(rootProblemCountsByDate));
