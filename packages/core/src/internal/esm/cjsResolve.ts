import { Package } from "../../createPackage.js";
import {
  esmFileFormat,
  lookupPackageScope,
  packageExportsResolve,
  packageImportsResolve,
  readPackageJson,
} from "./esmResolve.js";
import { nodeCoreModules } from "./nodeModules.js";

// require(X) from module at path Y
export function cjsResolve(fs: Package, fragment: string, parentURL: URL) {
  // 1. If X is a core module,
  //   a. return the core module
  //   b. STOP
  if (fragment.startsWith("node:")) {
    return { format: "node", resolved: new URL(fragment) };
  } else if (nodeCoreModules.includes(fragment)) {
    return { format: "node", resolved: new URL(`node:${fragment}`) };
  }

  // 2. If X begins with '/'
  if (fragment.startsWith("/")) {
    // a. set Y to be the file system root
    // nb: omitted
    throw new Error("not implemented");
  }

  // 3. If X begins with './' or '/' or '../'
  if (fragment.startsWith("./") || fragment.startsWith("../")) {
    // a. LOAD_AS_FILE(Y + X)
    const asFile = loadAsFile(fs, fragment, parentURL);
    if (asFile) {
      return asFile;
    }

    // b. LOAD_AS_DIRECTORY(Y + X)
    const asDirectory = loadAsDirectory(fs, new URL(`${fragment}/`, parentURL));
    if (asDirectory) {
      return asDirectory;
    }

    // c. THROW "not found"
    throw new Error("not found");
  }

  // 4. If X begins with '#'
  if (fragment.startsWith("#")) {
    // a. LOAD_PACKAGE_IMPORTS(X, dirname(Y))
    const asPackageImports = loadPackageImports(fs, fragment, new URL("./", parentURL));
    if (asPackageImports) {
      return asPackageImports;
    }
  }

  // 5. LOAD_PACKAGE_SELF(X, dirname(Y))
  const asSelf = loadPackageSelf(fs, fragment, new URL("./", parentURL));
  if (asSelf) {
    return asSelf;
  }

  // 6. LOAD_NODE_MODULES(X, dirname(Y))
  const asNodeModules = loadNodeModules(fs, fragment, new URL("./", parentURL));
  if (asNodeModules) {
    return asNodeModules;
  }

  // 7. THROW "not found"
  throw new Error("not found");
}

// LOAD_AS_FILE(X)
function loadAsFile(fs: Package, fragment: string, parentURL: URL) {
  // 1. If X is a file, load X as its file extension format. STOP
  const asFile = new URL(fragment, parentURL);
  if (fs.fileExists(verbatimFileURLToPath(asFile))) {
    return loadWithFormat(fs, asFile);
  }

  // 2. If X.js is a file, load X.js as JavaScript text. STOP
  const asJsFile = new URL(`${fragment}.js`, parentURL);
  if (fs.fileExists(verbatimFileURLToPath(asJsFile))) {
    return loadWithFormat(fs, asJsFile);
  }

  // 3. If X.json is a file, parse X.json to a JavaScript Object. STOP
  const asJsonFile = new URL(`${fragment}.json`, parentURL);
  if (fs.fileExists(verbatimFileURLToPath(asJsonFile))) {
    return loadWithFormat(fs, asJsonFile);
  }

  // 4. If X.node is a file, load X.node as binary addon. STOP
  const asNodeFile = new URL(`${fragment}.node`, parentURL);
  if (fs.fileExists(verbatimFileURLToPath(asNodeFile))) {
    return { format: "node", resolved: asNodeFile };
  }
}

// LOAD_INDEX(X)
function loadIndex(fs: Package, fragment: string, parentURL: URL) {
  // 1. If X/index.js is a file, load X/index.js as JavaScript text. STOP
  const asJsIndex = new URL(`${fragment}/index.js`, parentURL);
  if (fs.fileExists(verbatimFileURLToPath(asJsIndex))) {
    return loadWithFormat(fs, asJsIndex);
  }

  // 2. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
  const asJsonIndex = new URL(`${fragment}/index.json`, parentURL);
  if (fs.fileExists(verbatimFileURLToPath(asJsonIndex))) {
    return loadWithFormat(fs, asJsonIndex);
  }

  // 3. If X/index.node is a file, load X/index.node as binary addon. STOP
  const asNodeIndex = new URL(`${fragment}/index.node`, parentURL);
  if (fs.fileExists(verbatimFileURLToPath(asNodeIndex))) {
    return { format: "native", resolved: asNodeIndex };
  }
}

// LOAD_AS_DIRECTORY(X)
function loadAsDirectory(fs: Package, path: URL) {
  // 1. If X/package.json is a file,
  //   a. Parse X/package.json, and look for "main" field.
  const pjson = readPackageJson(fs, path);
  //   b. If "main" is a falsy value, GOTO 2.
  if (pjson === null || !pjson.name) {
    //    c. let M = X + (json main field)
    //    d. LOAD_AS_FILE(M)
    //    e. LOAD_INDEX(M)
    //    f. LOAD_INDEX(X) DEPRECATED
    //    g. THROW "not found"
  }
  // 2. LOAD_INDEX(X)
  return loadIndex(fs, ".", path);
}

function loadWithFormat(fs: Package, resolved: URL) {
  // nb: The algorithm doesn't specify this but the implementation seems to do something similar.
  // You cannot require a bare `.js` file from a `.cjs` parent with a `{"type":"module"}`
  // `package.json`.
  const format = esmFileFormat(fs, resolved);
  return { format, resolved };
}

// LOAD_NODE_MODULES(X, START)
function loadNodeModules(fs: Package, fragment: string, parentURL: URL) {
  // 1. let DIRS = NODE_MODULES_PATHS(START)
  // 2. for each DIR in DIRS:
  for (const dir of nodeModulesPaths(parentURL)) {
    // a. LOAD_PACKAGE_EXPORTS(X, DIR)
    const asPackageExports = loadPackageExports(fs, fragment, dir);
    if (asPackageExports) {
      return asPackageExports;
    }

    // b. LOAD_AS_FILE(DIR/X)
    const asFile = loadAsFile(fs, fragment, dir);
    if (asFile) {
      return asFile;
    }

    // c. LOAD_AS_DIRECTORY(DIR/X)
    const asDirectory = loadAsDirectory(fs, new URL(`${fragment}/`, dir));
    if (asDirectory) {
      return asDirectory;
    }
  }
}

// NODE_MODULES_PATHS(START)
function* nodeModulesPaths(path: URL) {
  // 1. let PARTS = path split(START)
  // 2. let I = count of PARTS - 1
  // 3. let DIRS = []
  // 4. while I >= 0,
  if (path.protocol !== "file:") {
    return;
  }
  do {
    // a. if PARTS[I] = "node_modules" CONTINUE
    if (path.pathname.endsWith("/node_modules/")) {
      continue;
    }
    // b. DIR = path join(PARTS[0 .. I] + "node_modules")
    yield new URL("./node_modules/", path);
    // c. DIRS = DIR + DIRS
    // d. let I = I - 1
    path = new URL("../", path);
  } while (path.pathname !== "/");
  // 5. return DIRS + GLOBAL_FOLDERS
}

// LOAD_PACKAGE_IMPORTS(X, DIR)
function loadPackageImports(fs: Package, fragment: string, parentURL: URL) {
  // 1. Find the closest package scope SCOPE to DIR.
  const packageURL = lookupPackageScope(fs, parentURL);

  // 2. If no scope was found, return.
  if (packageURL === null) {
    return;
  }

  // 3. If the SCOPE/package.json "imports" is null or undefined, return.
  const pjson = readPackageJson(fs, packageURL);
  if (pjson.imports == null) {
    return;
  }

  // 4. let MATCH = PACKAGE_IMPORTS_RESOLVE(X, pathToFileURL(SCOPE), ["node", "require"]) defined in
  //    the ESM resolver.
  const match = packageImportsResolve(fs, fragment, packageURL, ["node", "require"]);

  // 5. RESOLVE_ESM_MATCH(MATCH).
  return resolveEsmMatch(fs, match);
}

// LOAD_PACKAGE_EXPORTS(X, DIR)
function loadPackageExports(fs: Package, fragment: string, parentURL: URL) {
  // 1. Try to interpret X as a combination of NAME and SUBPATH where the name
  //    may have a @scope/ prefix and the subpath begins with a slash (`/`).
  const matches = /^((?:@[^/]+\/)?[^/]+)(.*)$/.exec(fragment);
  // 2. If X does not match this pattern or DIR/NAME/package.json is not a file,
  //    return.
  if (matches === null) {
    return;
  }
  const dir = new URL(`${matches[1]}/`, parentURL);
  const subpath = matches[2];

  // 3. Parse DIR/NAME/package.json, and look for "exports" field.
  const pjson = readPackageJson(fs, dir);
  if (pjson === null) {
    return;
  }

  // 4. If "exports" is null or undefined, return.
  if (pjson.exports == null) {
    return;
  }

  // 5. let MATCH = PACKAGE_EXPORTS_RESOLVE(pathToFileURL(DIR/NAME), "." + SUBPATH, `package.json`
  //    "exports", ["node", "require"]) defined in the ESM resolver.
  const match = packageExportsResolve(fs, dir, `.${subpath}`, pjson.exports, ["node", "require"]);

  // 6. RESOLVE_ESM_MATCH(MATCH)
  return resolveEsmMatch(fs, match);
}

// LOAD_PACKAGE_SELF(X, DIR)
function loadPackageSelf(fs: Package, fragment: string, parentURL: URL) {
  // 1. Find the closest package scope SCOPE to DIR.
  const packageURL = lookupPackageScope(fs, parentURL);

  // 2. If no scope was found, return.
  if (packageURL === null) {
    return;
  }

  // 3. If the SCOPE/package.json "exports" is null or undefined, return.
  const pjson = readPackageJson(fs, packageURL);
  if (pjson.exports == null) {
    return;
  }

  // 4. If the SCOPE/package.json "name" is not the first segment of X, return.
  if (fragment !== pjson.name && !fragment.startsWith(`${pjson.name}/`)) {
    return;
  }

  // 5. let MATCH = PACKAGE_EXPORTS_RESOLVE(pathToFileURL(SCOPE), "." + X.slice("name".length),
  //    `package.json` "exports", ["node", "require"]) defined in the ESM resolver.
  const match = packageExportsResolve(fs, packageURL, `./${fragment.slice(pjson.name.length)}`, pjson.exports, [
    "node",
    "require",
  ]);

  // 6. RESOLVE_ESM_MATCH(MATCH)
  return resolveEsmMatch(fs, match);
}

// RESOLVE_ESM_MATCH(MATCH)
function resolveEsmMatch(fs: Package, match: URL) {
  // 1. let RESOLVED_PATH = fileURLToPath(MATCH)
  const resolvedPath = verbatimFileURLToPath(match);

  // 2. If the file at RESOLVED_PATH exists, load RESOLVED_PATH as its extension format. STOP
  if (fs.fileExists(resolvedPath)) {
    return loadWithFormat(fs, match);
  }

  // 3. THROW "not found"
  throw new Error("not found");
}

// nb: We use URLs for the path traversal convenience, but `require("./file.cjs?")` should be read
// as-is.
function verbatimFileURLToPath(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`;
}
