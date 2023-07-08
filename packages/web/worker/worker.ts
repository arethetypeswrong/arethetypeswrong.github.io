import {
  checkPackage,
  createPackageFromNpm,
  createPackageFromTarballData,
  type CheckResult,
} from "@arethetypeswrong/core";

export interface CheckPackageEventData {
  kind: "check-package";
  packageSpec: string;
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

onmessage = async (event: MessageEvent<CheckPackageEventData | CheckFileEventData>) => {
  const result = await checkPackage(
    event.data.kind === "check-file"
      ? await createPackageFromTarballData(event.data.file)
      : await createPackageFromNpm(event.data.packageSpec)
  );
  postMessage({
    kind: "result",
    data: {
      result,
    },
  } satisfies ResultMessage);
};
