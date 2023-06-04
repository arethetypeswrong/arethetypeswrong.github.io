import type { ResultMessage } from "../worker/worker.ts";
import { subscribeRenderer } from "./renderer.ts";
import { updateState, type PackageInfo, getState, subscribe, type State } from "./state.ts";
import { shallowEqual } from "./utils/shallowEqual.ts";
import NProgress from "nprogress";
import { parsePackageSpec, type ParsedPackageSpec } from "@arethetypeswrong/core";

const worker = new Worker(new URL("../worker/worker.ts", import.meta.url), { type: "module" });
worker.onmessage = async (event: MessageEvent<ResultMessage>) => {
  updateState((state) => {
    state.checks = event.data.data;
    state.isLoading = false;
    state.message = undefined;
  });

  const params = new URLSearchParams(location.search);
  const state = getState();
  if (state.packageInfo.parsed) {
    params.set(
      "p",
      `${state.packageInfo.parsed.packageName}${
        state.packageInfo.info?.version ? `@${state.packageInfo.info.version}` : ""
      }`
    );
    history.replaceState(null, "", `?${params}`);
  }
};

NProgress.configure({ showSpinner: false });

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

subscribe((prevState) => {
  const state = getState();
  if (state.isLoading && !prevState.isLoading) {
    NProgress.start();
  } else if (!state.isLoading && prevState.isLoading) {
    NProgress.done();
  }
});

if (location.search) {
  const packageNameInput = document.getElementById("package-spec") as HTMLInputElement;
  const params = new URLSearchParams(location.search);
  const packageSpec = params.get("p");
  if (packageSpec) {
    packageNameInput.value = packageSpec;
    onPackageNameInput(packageSpec);
    getPackageInfo().then(() => {
      const info = getState().packageInfo.info;
      console.log(info);
      if (info && info.size && info.size < 1_000_000 && !navigator.connection?.saveData) {
        onCheck();
      }
    });
  }
}

function onPackageNameInput(value: string) {
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
