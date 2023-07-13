import { useState } from "react";
import type { ResultMessage } from "../../worker/worker";
import PackageAnalysis from "./packageAnalysis";
import UntypedPackage from "./untypedPackage";
import PackageForm from "./packageForm";
import { useSearchParams } from "react-router-dom";

export default function Main() {
  const [checkResult, setCheckResult] = useState<ResultMessage | null>(null);
  const [searchParams] = useSearchParams();

  const packageName = searchParams.get("p");
  console.log("Analyzing types for ", packageName);

  return (
    <main>
      <div id="header">
        <h1>Are the types wrong?</h1>
        <a href="https://github.com/arethetypeswrong/arethetypeswrong.github.io">GitHub / About</a>
      </div>
      <PackageForm setPackageAnalysis={setCheckResult} />
      {checkResult && <CheckResult resultMessage={checkResult} />}
    </main>
  );
}

function CheckResult({ resultMessage }: { resultMessage: ResultMessage }) {
  const result = resultMessage.data.result;

  if (result.type == "analysis") {
    return <PackageAnalysis analysis={result} />;
  }

  return <UntypedPackage result={result} />;
}
