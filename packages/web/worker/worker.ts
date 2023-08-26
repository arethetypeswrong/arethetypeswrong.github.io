import {
  checkPackage,
  createPackageFromNpm,
  createPackageFromTarballData,
  type CheckResult,
} from "@arethetypeswrong/core";
import { parsePackageSpec } from "@arethetypeswrong/core/utils";

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
      ? createPackageFromTarballData(event.data.file)
      : event.data.packageSpec.startsWith("@types/")
      ? await createPackageFromNpm(unmangleScopedPackageName(event.data.packageSpec), {
          definitelyTyped: parsePackageSpec(event.data.packageSpec).data?.version,
        })
      : await createPackageFromNpm(event.data.packageSpec)
  );
  postMessage({
    kind: "result",
    data: {
      result,
    },
  } satisfies ResultMessage);
};

function unmangleScopedPackageName(packageName: string): string {
  return packageName.startsWith("@types/") ? packageName.slice(7).replace("__", "/") : packageName;
}
