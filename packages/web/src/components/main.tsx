import { useState } from "react";
import type { ResultMessage } from "../../worker/worker";
import PackageAnalysis from "./packageAnalysis";
import UntypedPackage from "./untypedPackage";
import PackageForm from "./packageForm";

export default function Main() {
  const [checkResult, setCheckResult] = useState<ResultMessage | null>(null);

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
