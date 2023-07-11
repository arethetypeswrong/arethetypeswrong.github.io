import type { UntypedResult } from "@arethetypeswrong/core";

type UntypedPackageProps = {
  result: UntypedResult;
};

export default function UntypedPackage({ result }: UntypedPackageProps) {
  return (
    <div>
      <h2>Untyped Package</h2>
      <p>{result.packageName}</p>
      <p>{result.packageVersion}</p>
      <p>{result.types}</p>
    </div>
  );
}
