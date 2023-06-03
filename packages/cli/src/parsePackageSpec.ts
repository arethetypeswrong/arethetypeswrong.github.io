import validatePackgeName from "validate-npm-package-name";

// Good grief https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const semverRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

interface ParsedPackageSpec {
  packageName: string;
  version: string | undefined;
}

type Failable<T> = { status: "error"; error: string } | { status: "success"; data: T };

export function parsePackageSpec(input: string): Failable<ParsedPackageSpec> {
  let packageName: string;
  let version: string;
  let i = 0;
  if (input.startsWith("@")) {
    i = input.indexOf("/");
    if (i === -1 || i === 1) {
      return {
        status: "error",
        error: "Invalid package name",
      };
    }
    if (input.substring(0, i) === "@types") {
      return {
        status: "error",
        error: "@types packages are not supported",
      };
    }
    i++;
  }
  i = input.indexOf("@", i);
  if (i === -1) {
    packageName = input;
  } else {
    packageName = input.slice(0, i);
    version = input.slice(i + 1);
  }

  // check if packageName is a valid npm package name
  if (validatePackgeName(packageName).errors) {
    return {
      status: "error",
      error: "Invalid package name",
    };
  }
  if (version && version !== "latest" && !semverRegex.test(version)) {
    return {
      status: "error",
      error: "Invalid version",
    };
  }
  return {
    status: "success",
    data: { packageName, version },
  };
}
