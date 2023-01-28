import type { ResultMessage } from "../worker/worker.ts";
import validatePackgeName from "validate-npm-package-name";
import { subscribeRenderer } from "./renderer.ts";
import {
  state,
  type AsyncFailable,
  type PackageInfo,
  type ParsedPackageSpec,
  type SyncFailable,
  actions,
} from "./state.ts";

const worker = new Worker(new URL("../worker/worker.ts", import.meta.url), { type: "module" });
worker.onmessage = (event: MessageEvent<ResultMessage>) => {
  actions.setChecks({
    status: "success",
    data: event.data.data,
  });
};

subscribeRenderer({
  onPackageNameInput: debounce(onPackageNameInput, 300),
  onCheck,
});

async function onPackageNameInput(value: string) {
  value = value.trim();
  if (!value) {
    actions.setParsedPackageSpec(undefined);
    actions.setPackageInfo(undefined);
    return;
  }
  const parsed = parsePackageSpec(value);
  actions.setParsedPackageSpec(parsed);
  if (parsed.status === "success") {
    actions.setPackageInfo({ status: "loading" });
    const info = await getPackageInfo(parsed.data);
    actions.setPackageInfo(info);
  }
}

function onCheck() {
  if (state.packageInfo.info?.status === "success" && state.packageInfo.parsed?.status === "success") {
    actions.setChecks({ status: "loading" });
    worker.postMessage({
      kind: "check-package",
      packageName: state.packageInfo.parsed.data.packageName,
      version: state.packageInfo.parsed.data.version,
    });
  }
}

async function getPackageInfo({ packageName, version }: ParsedPackageSpec): Promise<AsyncFailable<PackageInfo>> {
  const response = await fetch(`https://registry.npmjs.org/${packageName}/${version || "latest"}`);
  if (!response.ok) {
    return {
      status: "error",
      error: response.statusText,
    };
  }
  const data = await response.json();
  return {
    status: "success",
    data: {
      size: data.dist.unpackedSize,
    },
  };
}

function parsePackageSpec(input: string): SyncFailable<ParsedPackageSpec> {
  let packageName;
  let version;
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
  if (version && version !== "latest" && !/^\d+\.\d+\.\d+$/.test(version)) {
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

function debounce<T>(fn: (value: T) => void, delay: number) {
  let timeout: number | undefined;
  return (value: T) => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = undefined;
      fn(value);
    }, delay);
  };
}
