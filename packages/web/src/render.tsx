import { render } from "react-dom";
import PackageForm from "./components/packageForm";
import type { ResultMessage } from "../worker/worker";
import { useState } from "react";
import type { UntypedResult } from "@arethetypeswrong/core";
import PackageAnalysis from "./components/packageAnalysis";
import UntypedPackage from "./components/untypedPackage";

const app = document.getElementById("app");

function App() {
  const [checkResult, setCheckResult] = useState<ResultMessage | null>(null);

  return (
    <div>
      <h1>Are the types</h1>
      <PackageForm setPackageAnalysis={setCheckResult} />
      {checkResult && <CheckResult resultMessage={checkResult} />}
    </div>
  );
}

function CheckResult({ resultMessage }: { resultMessage: ResultMessage }) {
  const result = resultMessage.data.result;

  if (result.type == "analysis") {
    return <PackageAnalysis analysis={result} />;
  }

  return <UntypedPackage result={result} />;
}

render(<App />, app);
