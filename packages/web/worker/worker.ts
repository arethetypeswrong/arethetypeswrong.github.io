import { checkPackage, type Result } from "are-the-types-wrong-core";

export interface CheckPackageEventData {
  kind: 'check-package';
  packageName: string;
}

export interface ResultMessage {
  kind: 'result';
  data: Result;
}

onmessage = async (event: MessageEvent<CheckPackageEventData>) => {
  const result = await checkPackage(event.data.packageName);
  postMessage({
    kind: 'result',
    data: result,
  });
};
