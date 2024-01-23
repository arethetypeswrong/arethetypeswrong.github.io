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

export interface ErrorMessage {
  kind: "error";
  data: {
    error: string;
  };
}

export interface ResultMessage {
  kind: "result";
  data: {
    result: CheckResult;
  };
}

export type Message = ErrorMessage | ResultMessage;

onmessage = async (event: MessageEvent<CheckPackageEventData | CheckFileEventData>) => {
  try {
    const result = await checkPackage(
      event.data.kind === "check-file"
        ? createPackageFromTarballData(event.data.file)
        : event.data.packageSpec.startsWith("@types/")
        ? await createPackageFromNpm(getImplementationPackageName(event.data.packageSpec), {
            definitelyTyped: parsePackageSpec(event.data.packageSpec).data?.version,
          })
        : await createPackageFromNpm(event.data.packageSpec),
    );
    postMessage({
      kind: "result",
      data: {
        result,
      },
    } satisfies ResultMessage);
  } catch (err) {
    if (err instanceof Error) {
      postMessage({
        kind: "error",
        data: {
          error: err.message,
        },
      } satisfies ErrorMessage);
    }
  }
};

function getImplementationPackageName(typesPackageSpec: string): string {
  if (typesPackageSpec.startsWith("@types/")) {
    const name = typesPackageSpec.slice(7).replace("__", "/").replace(/@.*$/, "");
    return name.includes("/") ? `@${name}` : name;
  }
  // should not hit this I guess
  return typesPackageSpec.replace(/@.*$/, "");
}
