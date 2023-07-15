import { checkPackage, checkTgz, type CheckResult } from "@arethetypeswrong/core";

export interface CheckPackageEventData {
  kind: "check-package";
  packageName: string;
  version: string | undefined;
}

export interface CheckFileEventData {
  kind: "check-file";
  file: Uint8Array;
}

export interface ResultMessage {
  kind: "result";
  data: {
    result: CheckResult;
  };
}

export interface ReadyMessage {
  kind: "ready";
}

// Send a ready message to the main thread once the worker is fully set up
postMessage({ kind: "ready" } satisfies ReadyMessage);

onmessage = async (event: MessageEvent<CheckPackageEventData | CheckFileEventData>) => {
  const result =
    event.data.kind === "check-file"
      ? await checkTgz(event.data.file)
      : await checkPackage(event.data.packageName, event.data.version);
  postMessage({
    kind: "result",
    data: {
      result,
    },
  } satisfies ResultMessage);
};
