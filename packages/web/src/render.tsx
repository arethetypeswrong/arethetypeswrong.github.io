import { render } from "react-dom";
import PackageForm from "./components/packageForm";
import type { ResultMessage } from "../worker/worker";
import { useState } from "react";
import PackageAnalysis from "./components/packageAnalysis";
import UntypedPackage from "./components/untypedPackage";

const app = document.getElementById("app");

function App() {
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

render(<App />, app);
