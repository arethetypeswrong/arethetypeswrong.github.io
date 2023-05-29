import type {
  EntrypointResolutionProblem,
  ProblemKind,
  ProblemSummary,
  ResolutionKind,
  TypedAnalysis,
  Problem,
  SummarizedProblems,
  EntrypointResolutionProblemKind,
  FileProblemKind,
  FileProblem,
  EntrypointResolutionProblemSummary,
} from "./types.js";
import { isEntrypointResolutionProblem, isFileProblem } from "./utils.js";

export { resolvedThroughFallback } from "./utils.js";

const problemTitles: Record<ProblemKind, string> = {
  Wildcard: "Wildcards",
  NoResolution: "Resolution failed",
  UntypedResolution: "Could not find types",
  FalseESM: "Types are ESM, but implementation is CJS",
  FalseCJS: "Types are CJS, but implementation is ESM",
  CJSResolvesToESM: "Entrypoint is ESM-only",
  UnexpectedModuleSyntax: "Syntax is incompatible with detected module kind",
  FallbackCondition: "Resloved through fallback condition",
  CJSOnlyExportsDefault: "CJS module uses default export",
  FalseExportDefault: "Types incorrectly use default export",
  InternalResolutionError: "Internal resolution error",
};

const problemDescriptions: Record<ProblemKind, string> = {
  Wildcard: "Wildcards cannot yet be analyzed by this tool.",
  NoResolution: "Import failed to resolve.",
  UntypedResolution: "Import resolved to JavaScript files, but no types.",
  FalseESM:
    "Import resolved to a type declaration file that represents an ES module, but it looks like a runtime would resolve to a CommonJS module.",
  FalseCJS:
    "Import resolved to a type declaration file that represents a CommonJS module, but it looks like a runtime would resolve to an ES module.",
  CJSResolvesToESM:
    "CommonJS `require` resolved to an ES module, which is an error in Node. CommonJS modules in Node will only be able to access the entrypoint with a dynamic import.",
  UnexpectedModuleSyntax:
    "Syntax detected in the module is incompatible with the module kind according to the package.json or file extension. This is an error in Node and may cause problems in some bundlers.",
  FallbackCondition:
    "Import resolved through a conditional package.json export, but only after failing to resolve through an earlier condition. This behavior is a [TypeScript bug](https://github.com/microsoft/TypeScript/issues/50762) and should not be relied upon.",
  CJSOnlyExportsDefault:
    "Some CommonJS modules at package entrypoints contain a simulated `export default` with an `__esModule` marker, but no top-level `module.exports`. Node does not respect the `__esModule` marker, so accessing the intended default export will require using the `.default` property on the default import when importing from an ES module in Node (and in some bundlers under some circumstances).",
  FalseExportDefault:
    "The types resolved at ${entrypoints} use `export default` where the implementation appears to use `module.exports =`. Node treats a default import of these constructs from an ES module differently, so these types will make TypeScript under the `node16` resolution mode think an extra `.default` property access is required, but that will likely fail at runtime in Node. These types should use `export =` instead of `export default`.",
  InternalResolutionError: "Import found in a type declaration file failed to resolve.",
};

const moduleResolutionKinds: Record<ResolutionKind, string> = {
  node10: "node10",
  "node16-cjs": "node16",
  "node16-esm": "node16",
  bundler: "bundler",
};

export function groupByKind<K extends ProblemKind>(
  problems: (Problem & { kind: K })[]
): Partial<Record<K, (Problem & { kind: K })[]>> {
  const result: Partial<Record<K, (Problem & { kind: K })[]>> = {};
  for (const problem of problems) {
    (result[problem.kind] ??= []).push(problem);
  }
  return result;
}

export function summarizeProblems(analysis: TypedAnalysis): SummarizedProblems {
  const { problems } = analysis;
  const entrypointResolutionProblems = problems.filter(isEntrypointResolutionProblem);
  const fileProblems = problems.filter(isFileProblem);
  const groupedEntrypointResolutionProblems = groupByKind(entrypointResolutionProblems);
  const groupedFileProblems = groupByKind(fileProblems);
  const entrypointResolutionProblemSummaries: EntrypointResolutionProblemSummary<EntrypointResolutionProblem>[] = [];
  const fileProblemSummaries: ProblemSummary<FileProblem>[] = [];
  for (const kind in groupedEntrypointResolutionProblems) {
    const problems = groupedEntrypointResolutionProblems[kind as EntrypointResolutionProblemKind]!;
    const allTypedEntrypoints = new Set(
      Object.keys(analysis.entrypoints).filter((e) => analysis.entrypoints[e].hasTypes)
    );
    const groupedByEntrypoint = groupByEntrypoint(problems);
    const groupedByResolutionKind = groupByResolutionKind(problems);
    const fullRows = Object.values(groupedByResolutionKind)
      .map((problems) => {
        const unaffectedEntrypoints = new Set(allTypedEntrypoints);
        for (const problem of problems) {
          unaffectedEntrypoints.delete(problem.entrypoint);
        }
        return unaffectedEntrypoints.size === 0 ? problems : undefined;
      })
      .filter((g): g is EntrypointResolutionProblem[] => !!g);
    const summary: EntrypointResolutionProblemSummary<EntrypointResolutionProblem> = {
      kind: problems[0].kind,
      title: problemTitles[problems[0].kind],
      description: problemDescriptions[problems[0].kind],
      problems,
      entrypointsAffected: Object.keys(groupedByEntrypoint),
      resolutionKindsAffected: Object.keys(groupedByResolutionKind) as ResolutionKind[],
      resolutionKindsAffectedInAllEntrypoints: fullRows.map((r) => r[0].resolutionKind),
    };
    entrypointResolutionProblemSummaries.push(summary);
  }
  for (const kind in groupedFileProblems) {
    const problems = groupedFileProblems[kind as FileProblemKind]!;
    const summary: ProblemSummary<FileProblem> = {
      kind: problems[0].kind,
      title: problemTitles[problems[0].kind],
      description: problemDescriptions[problems[0].kind],
      problems,
    };
    fileProblemSummaries.push(summary);
  }
  return {
    entrypointResolutionProblems: entrypointResolutionProblemSummaries,
    fileProblems: fileProblemSummaries,
  };
}

// function getEntrypointResolutionProblemMessage(
//   kind: EntrypointResolutionProblemKind,
//   analysis: TypedAnalysis,
//   problems: EntrypointResolutionProblem[]
// ): Message {
//   if (kind === "Wildcard") {
//     return msg(() => `Wildcards cannot yet be analyzed by this tool.`);
//   }

//   const others = problems.filter(
//     (p) =>
//       !fullRows.some((r) => r[0].resolutionKind === p.resolutionKind) &&
//       !fullColumns.some((c) => c[0].entrypoint === p.entrypoint)
//   );

//   return msg(getMessageText);

//   function getMessageText(f: Formatters): string {
//     switch (kind) {
//       case "NoResolution":
//         return `Import failed to resolve.`;
//       case "UntypedResolution":
//         return `Import resolved to JavaScript files, but no types.`;
//       case "FalseESM":
//         return `Imports of ${entrypoints} under ${resolutionKinds} resolved to ESM types, but CJS implementations.`;
//       case "FalseCJS":
//         return `Imports of ${entrypoints} under ${resolutionKinds} resolved to CJS types, but ESM implementations.`;
//       case "CJSResolvesToESM":
//         return `Imports of ${entrypoints} resolved to ES modules from a CJS importing module. CJS modules in Node will only be able to access this entrypoint with a dynamic import.`;
//       case "Wildcard":
//         throw new Error("Wildcard should have been handled above.");
//       case "FallbackCondition":
//         return (
//           `Imports of ${entrypoints} under ${resolutionKinds} resolved through a conditional package.json export, but ` +
//           `only after failing to resolve through an earlier condition. This behavior is a ${f.a(
//             "TypeScript bug",
//             "https://github.com/microsoft/TypeScript/issues/50762"
//           )} and should not be relied upon.`
//         );
//       case "FalseExportDefault":
//         // Only issued in node16-esm
//         return (
//           `The types resolved at ${entrypoints} use ${f.code("export default")} where the implementation ` +
//           `appears to use ${f.code("module.exports =")}. Node treats a default import of these constructs from an ` +
//           `ES module differently, so these types will make TypeScript under the ${f.code("node16")} resolution mode ` +
//           `think an extra ${f.code(".default")} property access is required, but that will likely fail at runtime ` +
//           `in Node. These types should use ${f.code("export =")} instead of ${f.code("export default")}.`
//         );
//     }
//   }
// }

// function getFileProblemMessage(kind: FileProblemKind, problems: FileProblem[]): Message {
//   switch (kind) {
//     case "InternalResolutionError":
//       const resolutionOptions = new Set(problems.map((p) => (p as InternalResolutionProblem).resolutionOption));
//       const isNode16 = resolutionOptions.size === 1 && resolutionOptions.values().next().value === "node16";
//       const hasESMResolutionErrors = problems.some(
//         (p) => (p as InternalResolutionProblem).error.resolutionMode === ts.ModuleKind.ESNext
//       );
//       return msg(
//         (f) =>
//           `Some imports in type declaration files inside the package failed to resolve under ${formatResolutionOptions(
//             Array.from(resolutionOptions),
//             f
//           )}.` +
//           (isNode16 && hasESMResolutionErrors
//             ? ` Relative ESM imports in Node require file extensions, and the same restriction applies ` +
//               `inside declaration files. Either the declaration files do not match the JavaScript files, or ` +
//               `this package is actually incompatible with Node.`
//             : "")
//       );
//     case "CJSOnlyExportsDefault":
//       return msg(
//         (f) =>
//           `Some CommonJS modules at package entrypoints contain a simulated ` +
//           `${f.code("export default")} with an ${f.code("__esModule")} marker, but no top-level ` +
//           `${f.code("module.exports")}. Node does not respect the ${f.code("__esModule")} marker, ` +
//           `so accessing the intended default export will require a ${f.code(".default")} property ` +
//           `access in Node from an ES module.`
//       );
//     case "UnexpectedModuleSyntax":
//       const isAllUnexpectedESM = problems.every(
//         (p) => (p as UnexpectedModuleSyntaxProblem).expectedModuleKind === ts.ModuleKind.CommonJS
//       );
//       const isAllUnexpectedCJS = problems.every(
//         (p) => (p as UnexpectedModuleSyntaxProblem).expectedModuleKind === ts.ModuleKind.ESNext
//       );
//       const consistentReason = problems.reduce((prevReason: ModuleKindReason | undefined, p) => {
//         const reason = (p as UnexpectedModuleSyntaxProblem).moduleKind.detectedReason;
//         return !prevReason ? reason : prevReason === reason ? reason : undefined;
//       }, undefined);
//       const head = isAllUnexpectedESM
//         ? `Some JavaScript files use ESM syntax, but the detected module kind is CommonJS. `
//         : isAllUnexpectedCJS
//         ? `Some JavaScript files use CommonJS syntax, but the detected module kind is ESM. `
//         : "Some JavaScript files use module syntax that disagrees with their detected module kind. ";
//       return msg(
//         (f) =>
//           head +
//           `This will be an error in Node (and potentially other runtimes and bundlers).` +
//           (consistentReason === "extension"
//             ? ` The module kind was decided based on the resolved files’ ${
//                 isAllUnexpectedCJS ? f.code(".mjs") : f.code(".cjs")
//               } extension.`
//             : consistentReason === "type"
//             ? ` The module kind was decided based on the nearest package.json’s ${f.code(`"type"`)} field.`
//             : consistentReason === "no:type"
//             ? ` The module kind was decided based on the nearest package.json’s lack of a ${f.code(
//                 `"type": "module"`
//               )} field.`
//             : "")
//       );
//   }
// }

function groupByResolutionKind(problems: EntrypointResolutionProblem[]) {
  return problems.reduce((result: Partial<Record<ResolutionKind, EntrypointResolutionProblem[]>>, problem) => {
    (result[problem.resolutionKind] ??= []).push(problem);
    return result;
  }, {});
}

function groupByEntrypoint(problems: EntrypointResolutionProblem[]) {
  return problems.reduce((result: Record<string, EntrypointResolutionProblem[]>, problem) => {
    (result[problem.entrypoint] ??= []).push(problem);
    return result;
  }, {});
}

// function formatResolutionKind(kind: ResolutionKind, f: Formatters) {
//   switch (kind) {
//     case "node10":
//     case "bundler":
//       return `the ${f.code(moduleResolutionKinds[kind])} module resolution setting`;
//     case "node16-cjs":
//       return (
//         `the ${f.code("node16")} module resolution setting when the importing module is CJS ` +
//         `(its extension is ${f.code(".cts")} or ${f.code(".cjs")}, or it has a ` +
//         `${f.code(".ts")} or ${f.code(".js")} extension and is in scope of a ${f.code("package.json")} ` +
//         `that does not contain ${f.code('"type": "module"')})`
//       );
//     case "node16-esm":
//       return (
//         `the ${f.code("node16")} module resolution setting when the importing module is ESM ` +
//         `(its extension is ${f.code(".mts")} or ${f.code(".mjs")}, or it has a ` +
//         `${f.code(".ts")} or ${f.code(".js")} extension and is in scope of a ${f.code("package.json")} ` +
//         `that contains ${f.code('"type": "module"')})`
//       );
//   }
// }

// function formatResolutionKinds(kinds: ResolutionKind[], f: Formatters) {
//   if (kinds.length === 1) {
//     return formatResolutionKind(kinds[0], f);
//   } else if (kinds.length === 2 && kinds.includes("node16-cjs") && kinds.includes("node16-esm")) {
//     return `the ${f.code("node16")} module resolution setting`;
//   } else if (kinds.length === allResolutionKinds.length - 1 && !kinds.includes("node10")) {
//     return f.strong("all modern module resolution settings");
//   } else if (kinds.length === allResolutionKinds.length) {
//     return f.strong("all module resolution settings");
//   } else if (kinds.length === 2 && kinds.includes("node16-esm") && kinds.includes("bundler")) {
//     return `resolution modes that use the ${f.code("import")} condition in package.json ${f.code(`"exports"`)}`;
//   } else {
//     return f.strong("multiple module resolution settings");
//   }
// }

// function formatResolutionOptions(kinds: ResolutionOption[], f: Formatters) {
//   switch (kinds.length) {
//     case 1:
//       return f.code(`--moduleResolution ${kinds[0]}`);
//     case 2:
//       return `the ${f.code(kinds[0])} and ${f.code(kinds[1])} ${f.code("moduleResolution")} options`;
//     default:
//       return f.strong(`all ${f.code("moduleResolution")} options`);
//   }
// }

// function formatEntrypoints(packageName: string, entrypoints: string[], entrypointCount: number, f: Formatters) {
//   if (entrypoints.length === 1) {
//     return formatEntrypoint(packageName, entrypoints[0], f);
//   }
//   if (entrypoints.length === entrypointCount) {
//     return f.strong("all entrypoints");
//   }
//   return f.strong("multiple entrypoints");
// }

// function formatEntrypoint(packageName: string, subpath: string, f: Formatters) {
//   return f.code(`"${subpath === "." ? packageName : `${packageName}/${subpath.substring(2)}`}"`);
// }

// type Formatters = Record<"strong" | "em" | "code", (text: string) => string> & {
//   a: (text: string, href: string) => string;
// };
// const identity = <T>(x: T) => x;
// const textFormatters: Formatters = {
//   strong: identity,
//   em: identity,
//   code: (text) => "`" + text + "`",
//   a: (text, href) => `${text} (${href})`,
// };
// const htmlFormatters: Formatters = {
//   strong: (text) => `<strong>${text}</strong>`,
//   em: (text) => `<em>${text}</em>`,
//   code: (text) => `<code>${nonBreaking(text)}</code>`,
//   a: (text, href) => `<a href="${href}">${text}</a>`,
// };

// function nonBreaking(text: string) {
//   return text.length < 20 ? text.replace(/ /g, "\u00a0") : text;
// }

// function msg(cb: (format: Formatters) => string): Message {
//   return {
//     text: cb(textFormatters),
//     html: cb(htmlFormatters),
//   };
// }
