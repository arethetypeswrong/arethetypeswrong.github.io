import validatePackgeName from "validate-npm-package-name";
import type { ResultMessage } from "../worker/worker.ts";
import { subscribeRenderer } from "./renderer.ts";
import {
  updateState,
  type PackageInfo,
  type ParsedPackageSpec,
  getState,
  subscribe,
  type State,
  deserializeState,
  setState,
  serializeState,
} from "./state.ts";
import { shallowEqual } from "./utils/shallowEqual.ts";

// Good grief https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const semverRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const worker = new Worker(new URL("../worker/worker.ts", import.meta.url), { type: "module" });
worker.onmessage = async (event: MessageEvent<ResultMessage>) => {
  updateState((state) => {
    state.checks = event.data.data;
    state.isLoading = false;
    state.message = undefined;
  });

  const state = getState();
  const serializedState = await serializeState(state);
  const params = new URLSearchParams(location.search);
  params.set("s", serializedState);
  history.replaceState(null, "", `?${params}`);
};

subscribeRenderer({
  onPackageNameInput,
  onCheck,
  onSelectFile: async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    worker.postMessage({ kind: "check-file", file: data });
  },
});

subscribe(debounce(getPackageInfo, 300));

if (location.search) {
  const params = new URLSearchParams(location.search);
  const serializedState = params.get("s");
  if (serializedState) {
    deserializeState(serializedState).then((state) => {
      const packageNameInput = document.getElementById("package-spec") as HTMLInputElement;
      if (state.packageInfo.parsed) {
        packageNameInput.value = `${state.packageInfo.parsed.packageName}${
          state.packageInfo.info?.version ? `@${state.packageInfo.info.version}` : ""
        }`;
      }
      setState(state);
    });
  }
}

async function onPackageNameInput(value: string) {
  value = value.trim();
  if (!value) {
    updateState((state) => {
      state.packageInfo.info = undefined;
      state.packageInfo.parsed = undefined;
      state.message = undefined;
    });
    return;
  }
  const parsed = parsePackageSpec(value);
  if (parsed.status === "error") {
    updateState((state) => {
      state.packageInfo.info = undefined;
      state.packageInfo.parsed = undefined;
      state.checks = undefined;
      state.message = {
        isError: true,
        text: parsed.error,
      };
    });
    return;
  }
  if (!shallowEqual(getState().packageInfo.parsed, parsed.data)) {
    updateState((state) => {
      state.packageInfo.parsed = parsed.data;
      state.checks = undefined;
    });
  }
}

async function getPackageInfo(prevState?: State) {
  const state = getState();
  const parsed = state.packageInfo.parsed;
  if (parsed && (!prevState || !shallowEqual(prevState.packageInfo.parsed, parsed))) {
    try {
      const info = await fetchPackageInfo(parsed);
      updateState((state) => {
        state.packageInfo.info = info;
        state.message = {
          isError: false,
          text: info.size
            ? `Checking will stream whatever ${info.size} bytes gzipped is`
            : "Checking will stream the tarball",
        };
      });
    } catch (error) {
      updateState((state) => {
        state.packageInfo.info = undefined;
        state.message = {
          isError: true,
          text: (error as Error).message,
        };
      });
    }
  }
}

async function onCheck() {
  if (!getState().packageInfo.parsed) {
    return;
  }
  if (!getState().packageInfo.info) {
    await getPackageInfo();
  }
  const { packageInfo } = getState();
  if (packageInfo.info && packageInfo.parsed) {
    updateState((state) => void (state.isLoading = true));
    worker.postMessage({
      kind: "check-package",
      packageName: packageInfo.parsed.packageName,
      version: packageInfo.parsed.version,
    });
  }
}

async function fetchPackageInfo({ packageName, version }: ParsedPackageSpec): Promise<PackageInfo> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/${version || "latest"}`);
    if (!response.ok) {
      throw new Error("Failed to get package info");
    }
    const data = await response.json();
    return {
      size: data.dist.unpackedSize,
      version: data.version,
    };
  } catch (error) {
    throw new Error("Failed to get package info");
  }
}

type Failable<T> = { status: "error"; error: string } | { status: "success"; data: T };

function parsePackageSpec(input: string): Failable<ParsedPackageSpec> {
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
