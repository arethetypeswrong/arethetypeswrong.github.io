import type { UntypedResult } from "@arethetypeswrong/core";

type UntypedPackageProps = {
  result: UntypedResult;
};

export default function UntypedPackage({ result }: UntypedPackageProps) {
  return (
    <div>
      <h2>
        {result.packageName} v{result.packageVersion}{" "}
        <small>
          (
          <a href={`https://npmjs.com/${result.packageName}`} target="_blank">
            npm
          </a>
          ,
          <a href={`https://unpkg.com/browse/${result.packageName}@${result.packageVersion}/`} target="_blank">
            unpkg
          </a>
          )
        </small>
      </h2>
      <p>This package does not contain types</p>
    </div>
  );
}
