import { Package } from "../../createPackage.js";
import { nodeCoreModules } from "./nodeModules.js";

// defaultConditions is the conditional environment name array, [ "node", "import" ].
const defaultConditions = ["node", "import"];

// ESM_RESOLVE(specifier, parentURL)
export function esmResolve(fs: Package, specifier: string, parentURL: URL) {
  // 1. Let resolved be undefined.
  const resolved = (() => {
    try {
      // 2. If specifier is a valid URL, then
      //   1. Set resolved to the result of parsing and reserializing specifier as a URL.
      return new URL(specifier);
    } catch {}

    // 3. Otherwise, if specifier starts with "/", "./", or "../", then
    //   1. Set resolved to the URL resolution of specifier relative to parentURL.
    if (/^(\/|\.\.?\/)/.test(specifier)) {
      return new URL(specifier, parentURL);
    }

    // 4. Otherwise, if specifier starts with "#", then
    //   1. Set resolved to the result of PACKAGE_IMPORTS_RESOLVE(specifier, parentURL, defaultConditions).
    if (specifier.startsWith("#")) {
      return packageImportsResolve(fs, specifier, parentURL, defaultConditions);
    }

    // 5. Otherwise,
    //   1. Note: specifier is now a bare specifier.
    //   2. Set resolved the result of PACKAGE_RESOLVE(specifier, parentURL).
    return packageResolve(fs, specifier, parentURL);
  })();

  // 6. Let format be undefined.
  const format = (() => {
    // 7. If resolved is a "file:" URL, then
    if (resolved.protocol === "file:") {
      // 1. If resolved contains any percent encodings of "/" or "\" ("%2F" and "%5C" respectively), then
      if (/%2F|%5C/.test(resolved.href)) {
        // 1. Throw an Invalid Module Specifier error.
        throw new Error("Invalid Module Specifier");
      }

      // 2. If the file at resolved is a directory, then
      if (fs.directoryExists(resolved.pathname)) {
        // 1. Throw an Unsupported Directory Import error.
        throw new Error("Unsupported Directory Import");
      }

      // 3. If the file at resolved does not exist, then
      if (!fs.fileExists(resolved.pathname)) {
        // 1. Throw a Module Not Found error.
        throw new Error("Module Not Found");
      }

      // 4. Set resolved to the real path of resolved, maintaining the same URL querystring and fragment components.
      // 5. Set format to the result of ESM_FILE_FORMAT(resolved).
      return esmFileFormat(fs, resolved);
    }

    // 8. Otherwise,
    if (resolved.protocol === "node:") {
      // 1. Set format the module format of the content type associated with the URL resolved.
      return "node";
    }

    // nb: otherwise omitted
    return;
  })();

  // 9. Return format and resolved to the loading phase
  return { format, resolved };
}

// PACKAGE_RESOLVE(packageSpecifier, parentURL)
function packageResolve(fs: Package, packageSpecifier: string, parentURL: URL) {
  // 1. Let packageName be undefined.
  const packageName = (() => {
    // 2. If packageSpecifier is an empty string, then
    if (packageSpecifier === "") {
      // 1. Throw an Invalid Module Specifier error.
      throw new Error("Invalid Module Specifier");
    }

    // 3. If packageSpecifier is a Node.js builtin module name, then
    if (nodeCoreModules.includes(packageSpecifier)) {
      // 1. Return the string "node:" concatenated with packageSpecifier.
      return `node:${packageSpecifier}`;
    }

    // 4. If packageSpecifier does not start with "@", then
    if (!packageSpecifier.startsWith("@")) {
      // 1. Set packageName to the substring of packageSpecifier until the first "/" separator or
      //    the end of the string.
      return packageSpecifier.split("/")[0];
    }

    // 5. Otherwise,
    const matches = /^([^/]*\/[^/]*)/.exec(packageSpecifier);
    //   1. If packageSpecifier does not contain a "/" separator, then
    if (matches === null) {
      // 1. Throw an Invalid Module Specifier error.
      throw new Error("Invalid Module Specifier");
    }
    // 2. Set packageName to the substring of packageSpecifier until the second "/" separator or the
    //    end of the string.
    return matches[1];
  })();

  // 6. If packageName starts with "." or contains "\" or "%", then
  if (packageName.startsWith(".") || packageName.includes("\\") || packageName.includes("%")) {
    // 1. Throw an Invalid Module Specifier error.
    throw new Error("Invalid Module Specifier");
  }

  // 7. Let packageSubpath be "." concatenated with the substring of packageSpecifier from the
  //    position at the length of packageName.
  const packageSubpath = `.${packageSpecifier.substring(packageName.length)}`;

  // 8. If packageSubpath ends in "/", then
  if (packageSubpath.endsWith("/")) {
    // 1. Throw an Invalid Module Specifier error.
    throw new Error("Invalid Module Specifier");
  }

  // 9. Let selfUrl be the result of PACKAGE_SELF_RESOLVE(packageName, packageSubpath, parentURL).
  const selfUrl = packageSelfResolve(fs, packageName, packageSubpath, parentURL);

  // 10. If selfUrl is not undefined, return selfUrl.
  if (selfUrl !== undefined) {
    return selfUrl;
  }

  // 11. While parentURL is not the file system root,
  // nb: Modified to search up to "root"
  do {
    // 1. Let packageURL be the URL resolution of "node_modules/" concatenated with
    //    packageSpecifier, relative to parentURL.
    const packageURL = new URL(`node_modules/${packageSpecifier}/`, parentURL);

    // 2. Set parentURL to the parent folder URL of parentURL.
    parentURL = new URL("../", parentURL);

    // 3. If the folder at packageURL does not exist, then
    if (!fs.directoryExists(packageURL.pathname)) {
      // 1. Continue the next loop iteration.
      continue;
    }

    // 4. Let pjson be the result of READ_PACKAGE_JSON(packageURL).
    const pjson = readPackageJson(fs, packageURL);

    // 5. If pjson is not null and pjson.exports is not null or undefined, then
    if (pjson !== null && pjson.exports != null) {
      // 1. Return the result of PACKAGE_EXPORTS_RESOLVE(packageURL, packageSubpath, pjson.exports,
      //    defaultConditions).
      return packageExportsResolve(fs, packageURL, packageSubpath, pjson.exports, defaultConditions);
    }

    // 6. Otherwise, if packageSubpath is equal to ".", then
    if (packageSubpath === ".") {
      // 1. If pjson.main is a string, then
      if (typeof pjson.main === "string") {
        // 1. Return the URL resolution of main in packageURL.
        return new URL(pjson.main, packageURL);
      }

      // 2. Otherwise,
      //   1. Return the URL resolution of packageSubpath in packageURL.
      return new URL(packageSubpath, packageURL);
    }
  } while (parentURL.pathname !== "/");

  // 12. Throw a Module Not Found error
  throw new Error("Module Not Found");
}

// PACKAGE_SELF_RESOLVE(packageName, packageSubpath, parentURL)
function packageSelfResolve(fs: Package, packageName: string, packageSubpath: string, parentURL: URL) {
  // 1. Let packageURL be the result of LOOKUP_PACKAGE_SCOPE(parentURL).
  const packageURL = lookupPackageScope(fs, parentURL);

  // 2. If packageURL is null, then
  if (packageURL === null) {
    // 1. Return undefined.
    return;
  }

  // 3. Let pjson be the result of READ_PACKAGE_JSON(packageURL).
  const pjson = readPackageJson(fs, packageURL);

  // 4. If pjson is null or if pjson.exports is null or undefined, then
  if (pjson === null || pjson.exports == null) {
    // 1. Return undefined.
    return;
  }

  // 5. If pjson.name is equal to packageName, then
  if (pjson.name === packageName) {
    // 1. Return the result of PACKAGE_EXPORTS_RESOLVE(packageURL, packageSubpath, pjson.exports, defaultConditions).
    return packageExportsResolve(fs, packageURL, packageSubpath, pjson.exports, defaultConditions);
  }

  // 6. Otherwise, return undefined.
  return;
}

// PACKAGE_EXPORTS_RESOLVE(packageURL, subpath, exports, conditions)
export function packageExportsResolve(
  fs: Package,
  packageURL: URL,
  subpath: string,
  exports: unknown,
  conditions: readonly string[],
) {
  // 1. If exports is an Object with both a key starting with "." and a key not starting with ".",
  //    throw an Invalid Package Configuration error.
  const exportsIsObject = typeof exports === "object" && exports !== null;
  const exportsKeys = exportsIsObject ? Object.keys(exports) : undefined;
  const hasDotKeys = exportsKeys?.some((key) => key.startsWith("."));
  const hasNonDotKeys = exportsKeys?.some((key) => !key.startsWith("."));
  if (hasDotKeys && hasNonDotKeys) {
    throw new Error("Invalid Package Configuration");
  }

  // 2. If subpath is equal to ".", then
  if (subpath === ".") {
    // 1. Let mainExport be undefined.
    const mainExport = (() => {
      // 2. If exports is a String or Array, or an Object containing no keys starting with ".", then
      if (typeof exports === "string" || Array.isArray(exports) || !hasDotKeys) {
        // 1. Set mainExport to exports.
        return exports;
      }

      // 3. Otherwise if exports is an Object containing a "." property, then
      if (exportsIsObject && "." in exports) {
        // 1. Set mainExport to the value of the "." property in exports.
        return exports["."];
      }
    })();

    // 4. If mainExport is not undefined, then
    if (mainExport !== undefined) {
      // 1. Let resolved be the result of PACKAGE_TARGET_RESOLVE(packageURL, mainExport, null,
      //    false, conditions).
      const resolved = packageTargetResolve(fs, packageURL, mainExport, null, false, conditions);

      // 2. If resolved is not null or undefined, return resolved.
      if (resolved != null) {
        return resolved;
      }
    }
  }

  // 3. Otherwise, if exports is an Object and all keys of exports start with ".", then
  if (exportsIsObject && hasDotKeys && !hasNonDotKeys) {
    // 1. Assert: subpath begins with "./".
    // 2. Let resolved be the result of PACKAGE_IMPORTS_EXPORTS_RESOLVE(subpath, exports,
    //    packageURL, false, conditions).
    const resolved = packageImportsExportsResolve(
      fs,
      subpath,
      exports satisfies object as Record<string, unknown>,
      packageURL,
      false,
      conditions,
    );

    // 3. If resolved is not null or undefined, return resolved.
    if (resolved != null) {
      return resolved;
    }
  }

  // 4. Throw a Package Path Not Exported error.
  throw new Error("Package Path Not Exported");
}

// PACKAGE_IMPORTS_RESOLVE(specifier, parentURL, conditions)
export function packageImportsResolve(fs: Package, specifier: string, parentURL: URL, conditions: readonly string[]) {
  // 1. Assert: specifier begins with "#".
  // 2. If specifier is exactly equal to "#" or starts with "#/", then
  if (specifier === "#" || specifier.startsWith("#/")) {
    // 1. Throw an Invalid Module Specifier error.
    throw new Error("Invalid Module Specifier");
  }

  // 3. Let packageURL be the result of LOOKUP_PACKAGE_SCOPE(parentURL).
  const packageURL = lookupPackageScope(fs, parentURL);

  // 4. If packageURL is not null, then
  if (packageURL !== null) {
    // 1. Let pjson be the result of READ_PACKAGE_JSON(packageURL).
    const pjson = readPackageJson(fs, packageURL);

    // 2. If pjson.imports is a non-null Object, then
    if (typeof pjson.imports === "object" && pjson?.imports !== null) {
      // 1. Let resolved be the result of PACKAGE_IMPORTS_EXPORTS_RESOLVE(specifier, pjson.imports,
      //    packageURL, true, conditions).
      const resolved = packageImportsExportsResolve(fs, specifier, pjson.imports, packageURL, true, conditions);

      // 2. If resolved is not null or undefined, return resolved.
      if (resolved != null) {
        return resolved;
      }
    }
  }

  // 5. Throw a Package Import Not Defined error.
  throw new Error("Package Import Not Defined");
}

// PACKAGE_IMPORTS_EXPORTS_RESOLVE(matchKey, matchObj, packageURL, isImports, conditions)
function packageImportsExportsResolve(
  fs: Package,
  matchKey: string,
  matchObj: Record<string, unknown>,
  packageURL: URL,
  isImports: boolean,
  conditions: readonly string[],
) {
  // 1. If matchKey is a key of matchObj and does not contain "*", then
  if (matchKey in matchObj && !matchKey.includes("*")) {
    // 1. Let target be the value of matchObj[matchKey].
    const target = matchObj[matchKey];

    // 2. Return the result of PACKAGE_TARGET_RESOLVE(packageURL, target, null, isImports,
    //    conditions).
    return packageTargetResolve(fs, packageURL, target, null, isImports, conditions);
  }

  // 2. Let expansionKeys be the list of keys of matchObj containing only a single "*", sorted by
  //    the sorting function PATTERN_KEY_COMPARE which orders in descending order of specificity.
  const expansionKeys = Object.keys(matchObj)
    .filter((key) => {
      const ii = key.indexOf("*");
      return ii !== -1 && ii === key.lastIndexOf("*");
    })
    .sort(patternKeyCompare);

  // 3. For each key expansionKey in expansionKeys, do
  for (const key of expansionKeys) {
    // 1. Let patternBase be the substring of expansionKey up to but excluding the first "*"
    //    character.
    const patternBase = key.substring(0, key.indexOf("*"));

    // 2. If matchKey starts with but is not equal to patternBase, then
    if (matchKey.startsWith(patternBase) && matchKey !== patternBase) {
      // 1. Let patternTrailer be the substring of expansionKey from the index after the first "*"
      //    character.
      const patternTrailer = key.substring(key.indexOf("*") + 1);

      // 2. If patternTrailer has zero length, or if matchKey ends with patternTrailer and the
      //    length of matchKey is greater than or equal to the length of expansionKey, then
      if (patternTrailer.length === 0 || (matchKey.endsWith(patternTrailer) && matchKey.length >= key.length)) {
        // 1. Let target be the value of matchObj[expansionKey].
        const target = matchObj[key];

        // 2. Let patternMatch be the substring of matchKey starting at the index of the length of
        //    patternBase up to the length of matchKey minus the length of patternTrailer.
        const patternMatch = matchKey.substring(patternBase.length, matchKey.length - patternTrailer.length);

        // 3. Return the result of PACKAGE_TARGET_RESOLVE(packageURL, target, patternMatch,
        //    isImports, conditions).
        return packageTargetResolve(fs, packageURL, target, patternMatch, isImports, conditions);
      }
    }
  }

  // 4. Return null
  return null;
}

// PATTERN_KEY_COMPARE(keyA, keyB)
function patternKeyCompare(keyA: string, keyB: string) {
  // 1. Assert: keyA ends with "/" or contains only a single "*".
  // 2. Assert: keyB ends with "/" or contains only a single "*".

  // 3. Let baseLengthA be the index of "*" in keyA plus one, if keyA contains "*", or the length of keyA otherwise.
  const baseLengthA = keyA.includes("*") ? keyA.indexOf("*") + 1 : keyA.length;

  // 4. Let baseLengthB be the index of "*" in keyB plus one, if keyB contains "*", or the length of keyB otherwise.
  const baseLengthB = keyB.includes("*") ? keyB.indexOf("*") + 1 : keyB.length;

  // 5. If baseLengthA is greater than baseLengthB, return -1.
  // 6. If baseLengthB is greater than baseLengthA, return 1.
  const baseDifference = baseLengthB - baseLengthA;
  if (baseDifference !== 0) {
    return baseDifference;
  }

  // 7. If keyA does not contain "*", return 1.
  if (!keyA.includes("*")) {
    return 1;
  }

  // 8. If keyB does not contain "*", return -1.
  if (!keyB.includes("*")) {
    return -1;
  }

  // 9. If the length of keyA is greater than the length of keyB, return -1.
  // 10. If the length of keyB is greater than the length of keyA, return 1.
  const difference = keyB.length - keyA.length;
  if (difference !== 0) {
    return difference;
  }

  // 11. Return 0.
  return 0;
}

// PACKAGE_TARGET_RESOLVE(packageURL, target, patternMatch, isImports, conditions)
function packageTargetResolve(
  fs: Package,
  packageURL: URL,
  target: unknown,
  patternMatch: string | null,
  isImports: boolean,
  conditions: readonly string[],
): URL | null | undefined {
  // 1. If target is a String, then
  if (typeof target === "string") {
    // 1. If target does not start with "./", then
    if (!target.startsWith("./")) {
      // 1. If isImports is false, or if target starts with "../" or "/", or if target is a valid
      //    URL, then
      if (!isImports || target.startsWith("../") || target.startsWith("/") || URL.canParse(target)) {
        // 1. Throw an Invalid Package Target error.
        throw new Error("Invalid Package Target error");
      }

      // 2. If patternMatch is a String, then
      if (patternMatch !== null) {
        // 1. Return PACKAGE_RESOLVE(target with every instance of "*" replaced by patternMatch,
        //    packageURL + "/").
        return packageResolve(fs, target.replace(/\*/g, patternMatch), new URL(`${packageURL}/`));
      } else {
        // 3. Return PACKAGE_RESOLVE(target, packageURL + "/").
        return packageResolve(fs, target, new URL(`${packageURL}/`));
      }
    }

    // 2. If target split on "/" or "\" contains any "", ".", "..", or "node_modules" segments after
    //    the first "." segment, case insensitive and including percent encoded variants, throw an
    //    Invalid Package Target error.
    if (
      target
        .slice(2)
        .split(/\/|\\/)
        .some((segment) => segment === "" || segment === "." || segment === ".." || segment === "node_modules")
    ) {
      throw new Error("Invalid Package Target error");
    }

    // 3. Let resolvedTarget be the URL resolution of the concatenation of packageURL and target.
    const resolvedTarget = new URL(target, packageURL);

    // 4. Assert: packageURL is contained in resolvedTarget.
    // 5. If patternMatch is null, then
    if (patternMatch === null) {
      // 1. Return resolvedTarget.
      return resolvedTarget;
    }

    // 6. If patternMatch split on "/" or "\" contains any "", ".", "..", or "node_modules"
    //    segments, case insensitive and including percent encoded variants, throw an Invalid Module
    //    Specifier error.
    if (
      patternMatch
        .split(/\/|\\/)
        .some((segment) => segment === "" || segment === "." || segment === ".." || segment === "node_modules")
    ) {
      throw new Error("Invalid Module Specifier");
    }

    // 7. Return the URL resolution of resolvedTarget with every instance of "*" replaced with patternMatch.
    return new URL(resolvedTarget.href.replace(/\*/g, patternMatch));
  }

  // 2. Otherwise, if target is a non-null Object, then
  if (typeof target === "object" && target !== null) {
    // 1. If target contains any index property keys, as defined in ECMA-262 6.1.7 Array Index ,
    //    throw an Invalid Package Configuration error.
    if (Object.keys(target).some((key) => /^[0-9]+$/.test(key))) {
      throw new Error("Invalid Package Configuration error");
    }

    // 2. For each property p of target, in object insertion order as,
    for (const [property, targetValue] of Object.entries(target)) {
      // 1. If p equals "default" or conditions contains an entry for p, then
      if (property === "default" || conditions.includes(property)) {
        // 1. Let targetValue be the value of the p property in target.
        // 2. Let resolved be the result of PACKAGE_TARGET_RESOLVE(packageURL, targetValue, patternMatch,
        //    isImports, conditions).
        const resolved = packageTargetResolve(fs, packageURL, targetValue, patternMatch, isImports, conditions);

        // 3. If resolved is undefined, continue the loop.
        if (resolved === undefined) {
          continue;
        }

        // 4. Return resolved.
        return resolved;
      }
    }

    // 3. Return undefined.
    return;
  }

  // 3. Otherwise, if target is an Array, then
  if (Array.isArray(target)) {
    // 1. If target.length is zero, return null.
    if (target.length === 0) {
      return null;
    }

    // 2. For each item targetValue in target, do
    for (const targetValue of target) {
      // 1. Let resolved be the result of PACKAGE_TARGET_RESOLVE(packageURL, targetValue, patternMatch,
      //    isImports, conditions).
      const resolved = packageTargetResolve(fs, packageURL, targetValue, patternMatch, isImports, conditions);

      // 2. If resolved is undefined, continue the loop.
      if (resolved === undefined) {
        continue;
      }

      // 3. Return resolved.
      return resolved;
    }

    // 3. Return or throw the last fallback resolution null return or error.
    // nb: ????
    return null;
  }

  // 4. Otherwise, if target is null, return null.
  if (target === null) {
    return null;
  }

  // 5. Otherwise throw an Invalid Package Target error.
  throw new Error("Invalid Package Target error");
}

// ESM_FILE_FORMAT(url)
export function esmFileFormat(fs: Package, url: URL) {
  // 1. Assert: url corresponds to an existing file.
  // 2. If url ends in ".mjs", then
  if (url.pathname.endsWith(".mjs")) {
    // 1. Return "module".
    return "module";
  }

  // 3. If url ends in ".cjs", then
  if (url.pathname.endsWith(".cjs")) {
    // 1. Return "commonjs".
    return "commonjs";
  }

  // 4. If url ends in ".json", then
  if (url.pathname.endsWith(".json")) {
    // 1. Return "json".
    return "json";
  }

  // 5. If --experimental-wasm-modules is enabled and url ends in ".wasm", then
  if (url.pathname.endsWith(".wasm")) {
    // 1. Return "wasm".
    return "wasm";
  }

  // 6. Let packageURL be the result of LOOKUP_PACKAGE_SCOPE(url).
  const packageURL = lookupPackageScope(fs, url);
  if (packageURL === null) {
    // nb: The algorithm seems to be poorly specified here because `READ_PACKAGE_JSON` does not
    // handle the null case, but `LOOKUP_PACKAGE_SCOPE` is allowed to return `null`.
    throw new Error("Invalid Module Specifier");
  }

  // 7. Let pjson be the result of READ_PACKAGE_JSON(packageURL).
  const pjson = readPackageJson(fs, packageURL);

  // 8. Let packageType be null.
  // 9. If pjson?.type is "module" or "commonjs", then
  //   1. Set packageType to pjson.type.
  const packageType = pjson.type === "module" || pjson.type === "commonjs" ? (pjson.type as string) : null;

  // 10. If url ends in ".js", then
  if (url.pathname.endsWith(".js")) {
    // 1. If packageType is not null, then
    if (packageType !== null) {
      // 1. Return packageType.
      if (typeof packageType !== "string") {
        throw new Error("Invalid Package Configuration");
      }
      return packageType;
    }

    // 2. If --experimental-detect-module is enabled and the source of module contains static
    //    import or export syntax, then
    //   1. Return "module".
    // nb: omitted

    // 3. Return "commonjs".
    return "commonjs";
  }

  // 11. If url does not have any extension, then
  const segments = url.pathname.split("/");
  if (!segments[segments.length - 1].includes(".")) {
    // 1. If packageType is "module" and --experimental-wasm-modules is enabled and the file at url
    //    contains the header for a WebAssembly module, then
    //   1. Return "wasm".
    // nb: omitted

    // 2. If packageType is not null, then
    if (packageType !== null) {
      // 1. Return packageType.
      return packageType;
    }

    // 3. If --experimental-detect-module is enabled and the source of module contains static import
    //    or export syntax, then
    //   1. Return "module".
    // nb: omitted

    // 4. Return "commonjs".
    return "commonjs";
  }

  // 12. Return undefined (will throw during load phase).
  return;
}

// LOOKUP_PACKAGE_SCOPE(url)
export function lookupPackageScope(fs: Package, url: URL) {
  if (url.protocol !== "file:") {
    return null;
  }

  // 1. Let scopeURL be url.
  let scopeURL = url;

  // 2. While scopeURL is not the file system root,
  // nb: Modified to search to include "root", also for "parent URL" operation.
  do {
    // 2. If scopeURL ends in a "node_modules" path segment, return null.
    if (scopeURL.pathname.endsWith("/node_modules/")) {
      return null;
    }

    // 3. Let pjsonURL be the resolution of "package.json" within scopeURL.
    const pjsonURL = new URL("package.json", scopeURL);

    // 4. if the file at pjsonURL exists, then
    if (fs.fileExists(pjsonURL.pathname)) {
      // 1. Return scopeURL.
      return scopeURL;
    }

    // 1. Set scopeURL to the parent URL of scopeURL.
    scopeURL = new URL("../", scopeURL);
  } while (url.pathname !== "/");

  // 3. Return null.
  return null;
}

// READ_PACKAGE_JSON(packageURL)
export function readPackageJson(fs: Package, packageURL: URL) {
  // 1. Let pjsonURL be the resolution of "package.json" within packageURL.
  const pjsonURL = new URL("package.json", packageURL);

  // 2. If the file at pjsonURL does not exist, then
  if (!fs.fileExists(pjsonURL.pathname)) {
    // 1. Return null.
    return null;
  }

  // 3. If the file at packageURL does not parse as valid JSON, then
  //   1. Throw an Invalid Package Configuration error.
  // 4. Return the parsed JSON source of the file at pjsonURL.
  return JSON.parse(fs.readFile(pjsonURL.pathname));
}
