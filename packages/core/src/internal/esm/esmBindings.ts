import type { Exports } from "cjs-module-lexer";
import type { Identifier, Literal, Pattern } from "acorn";
import { parse as acornParse } from "acorn";

// Note: There is a pretty solid module `es-module-lexer` which performs a similar lexing operation
// as `cjs-module-lexer`, but has some limitations in what it can express. This implementation
// should be more complete.

function extractExportedName(node: Identifier | Literal) {
  switch (node.type) {
    case "Identifier":
      return node.name;
    case "Literal":
      if (typeof node.value !== "string") {
        throw new Error("Impossible non-string literal export");
      }
      return node.value;
  }
}

function* extractPatternIdentifiers(node: Pattern | null): Iterable<string> {
  if (node === null) {
    return;
  }
  switch (node.type) {
    case "ArrayPattern":
      for (const element of node.elements) {
        yield* extractPatternIdentifiers(element);
      }
      break;

    case "AssignmentPattern":
      yield* extractPatternIdentifiers(node.left);
      break;

    case "Identifier":
      yield node.name;
      break;

    case "MemberExpression":
      break;

    case "ObjectPattern":
      for (const property of node.properties) {
        switch (property.type) {
          case "Property":
            yield* extractPatternIdentifiers(property.value);
            break;
          case "RestElement":
            yield* extractPatternIdentifiers(property.argument);
            break;
        }
      }
      break;

    case "RestElement":
      yield* extractPatternIdentifiers(node.argument);
      break;
  }
}

export function getEsmModuleBindings(sourceText: string): Exports {
  const program = acornParse(sourceText, {
    ecmaVersion: "latest",
    sourceType: "module",
  });
  let exports: string[] = [];
  let reexports: string[] = [];
  for (const node of program.body) {
    switch (node.type) {
      case "ExportAllDeclaration":
        if (node.exported) {
          // `export * as namespace from 'specifier'`
          exports.push(extractExportedName(node.exported));
        } else {
          // `export * from 'specifier'`
          reexports.push(extractExportedName(node.source));
        }
        break;

      case "ExportDefaultDeclaration":
        // `export default ...`
        exports.push("default");
        break;

      case "ExportNamedDeclaration": {
        const { declaration, specifiers } = node;
        if (declaration) {
          switch (declaration.type) {
            case "ClassDeclaration":
            case "FunctionDeclaration":
              // `export class Foo {}`
              // `export function foo() {}`
              exports.push(declaration.id.name);
              break;

            // `export const foo = null;`
            // `export const { foo, bar } = null;`
            case "VariableDeclaration":
              for (const declarator of declaration.declarations) {
                exports.push(...extractPatternIdentifiers(declarator.id));
              }
              break;
          }
        }

        // `export { foo }`;
        exports.push(
          ...specifiers.map(({ exported }) => {
            switch (exported.type) {
              case "Identifier":
                return exported.name;
              case "Literal":
                return extractExportedName(exported);
            }
          }),
        );
      }
    }
  }

  return { exports, reexports };
}
