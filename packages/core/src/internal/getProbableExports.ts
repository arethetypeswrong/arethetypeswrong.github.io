import ts from "typescript";

const minifiedVariableAssignmentPattern = /[^\s];(?:var|let|const) [a-zA-Z0-9_]=[^\s]/;

export interface Export {
  name: string;
  node: ts.Node;
}

export function getProbableExports(sourceFile: ts.SourceFile): Export[] {
  return getEsbuildExports(sourceFile) ?? [];
}

function getEsbuildExports(sourceFile: ts.SourceFile): Export[] | undefined {
  const possibleIndex = sourceFile.text.indexOf("\n__export(");
  if (possibleIndex === -1 && !isProbablyMinified(sourceFile.text)) {
    return undefined;
  }

  for (const statement of sourceFile.statements) {
    if (possibleIndex !== -1 && statement.end < possibleIndex) {
      continue;
    }
    if (possibleIndex !== -1 && statement.pos > possibleIndex) {
      break;
    }
    if (
      ts.isExpressionStatement(statement) &&
      ts.isCallExpression(statement.expression) &&
      ts.isIdentifier(statement.expression.expression) &&
      statement.expression.arguments.length === 2 &&
      ts.isIdentifier(statement.expression.arguments[0]) &&
      ts.isObjectLiteralExpression(statement.expression.arguments[1])
    ) {
      const callTarget = statement.expression.expression;
      const isExport =
        ts.unescapeLeadingUnderscores(callTarget.escapedText) === "__export" ||
        isEsbuildExportFunction(sourceFile.locals?.get(callTarget.escapedText)?.valueDeclaration);
      if (isExport) {
        return statement.expression.arguments[1].properties.flatMap((prop): Export[] => {
          if (
            ts.isPropertyAssignment(prop) &&
            (ts.isIdentifier(prop.name) || ts.isStringOrNumericLiteralLike(prop.name))
          ) {
            return [{ name: prop.name.text, node: prop }];
          }
          if (ts.isShorthandPropertyAssignment(prop)) {
            return [{ name: prop.name.text, node: prop }];
          }
          return [];
        });
      }
    }
  }
}

function isEsbuildExportFunction(decl: ts.Declaration | undefined) {
  /*
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  b=(o,r)=>{for(var e in r)n(o,e,{get:r[e],enumerable:!0})}
  */
  if (!decl) {
    return false;
  }
  return (
    ts.isVariableDeclaration(decl) &&
    decl.initializer &&
    ts.isFunctionExpressionOrArrowFunction(decl.initializer) &&
    ts.isBlock(decl.initializer.body) &&
    decl.initializer.body.statements.length == 1 &&
    ts.isForInStatement(decl.initializer.body.statements[0])
  );
}

function isProbablyMinified(text: string): boolean {
  return minifiedVariableAssignmentPattern.test(text);
}
