import { checkPackage, checkTgz, type Analysis } from "@arethetypeswrong/core";

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
    analysis: Analysis;
  };
}

onmessage = async (event: MessageEvent<CheckPackageEventData | CheckFileEventData>) => {
  const analysis =
    event.data.kind === "check-file"
      ? await checkTgz(event.data.file)
      : await checkPackage(event.data.packageName, event.data.version);
  postMessage({
    kind: "result",
    data: {
      analysis,
    },
  } satisfies ResultMessage);
};
