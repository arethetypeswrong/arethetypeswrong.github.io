import ts from "typescript";

const minifiedVariableAssignmentPattern = /[^\s];(?:var|let|const) [a-zA-Z0-9_]=[^\s]/;

export interface Export {
  name: string;
  node: ts.Node;
}

export function getProbableExports(sourceFile: ts.SourceFile): Export[] {
  return getEsbuildBabelSwcExports(sourceFile) ?? getWebpackBootstrapExports(sourceFile) ?? [];
}

function getEsbuildBabelSwcExports(sourceFile: ts.SourceFile): Export[] | undefined {
  let possibleIndex = sourceFile.text.indexOf("\n__export(");
  if (possibleIndex === -1) {
    possibleIndex = sourceFile.text.indexOf("\n_export(");
  }
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
        callTarget.escapedText === "_export" ||
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
  esbuild:
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  esbuild min:
  b=(o,r)=>{for(var e in r)n(o,e,{get:r[e],enumerable:!0})}

  swc?
  function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
  }
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

function getWebpackBootstrapExports(sourceFile: ts.SourceFile): Export[] | undefined {
  for (const statement of sourceFile.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isBinaryExpression(statement.expression)) {
      continue;
    }
    const assignment = statement.expression;
    if (assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken || !isModuleExports(assignment.left)) {
      continue;
    }

    const bootstrapCall = ts.skipParentheses(assignment.right);
    if (!ts.isCallExpression(bootstrapCall)) {
      continue;
    }

    const bootstrap = ts.skipParentheses(bootstrapCall.expression);
    if (
      !ts.isFunctionExpression(bootstrap) ||
      !ts.isBlock(bootstrap.body) ||
      bootstrapCall.arguments.length !== 1 ||
      !ts.isArrayLiteralExpression(bootstrapCall.arguments[0])
    ) {
      continue;
    }

    const entryModuleId = getWebpackEntryModuleId(bootstrap.body);
    if (entryModuleId === undefined) {
      continue;
    }

    const entryModule = bootstrapCall.arguments[0].elements[entryModuleId];
    if (!entryModule || !ts.isFunctionExpression(entryModule)) {
      continue;
    }

    const exportsParameterName = entryModule.parameters[1]?.name;
    if (!exportsParameterName || !ts.isIdentifier(exportsParameterName)) {
      continue;
    }
    const exportsParameterText = exportsParameterName.text;

    const exports: Export[] = [];
    visit(entryModule.body);
    return exports;

    function visit(node: ts.Node) {
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isAccessExpression(node.left) &&
        ts.isIdentifier(node.left.expression) &&
        node.left.expression.text === exportsParameterText
      ) {
        const name = getNameOfAccessExpression(node.left);
        if (name !== undefined) {
          exports.push({ name, node });
        }
      }
      ts.forEachChild(node, visit);
    }
  }
}

function getWebpackEntryModuleId(body: ts.Block): number | undefined {
  for (const statement of body.statements) {
    if (!ts.isReturnStatement(statement) || !statement.expression) {
      continue;
    }

    return getWebpackEntryModuleIdFromExpression(statement.expression);
  }
}

function getWebpackEntryModuleIdFromExpression(expression: ts.Expression): number | undefined {
  expression = ts.skipParentheses(expression);
  if (ts.isCallExpression(expression) && expression.arguments.length === 1) {
    return getNumericValue(expression.arguments[0]);
  }
  if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.CommaToken) {
    return getWebpackEntryModuleIdFromExpression(expression.right);
  }
}

function getNumericValue(node: ts.Expression): number | undefined {
  node = ts.skipParentheses(node);
  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    return getNumericValue(node.right);
  }
}

function isModuleExports(node: ts.Expression) {
  return (
    ts.isAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "module" &&
    getNameOfAccessExpression(node) === "exports"
  );
}

function getNameOfAccessExpression(accessExpression: ts.AccessExpression): string | undefined {
  const node = ts.getNameOfAccessExpression(accessExpression);
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) {
    return node.text;
  }
}
