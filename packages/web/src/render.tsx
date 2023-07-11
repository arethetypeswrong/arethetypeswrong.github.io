import { render } from "react-dom";
import PackageForm from "./components/packageForm";
import type { ResultMessage } from "../worker/worker";
import { useState } from "react";
import type { Analysis, UntypedResult } from "@arethetypeswrong/core";

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

function PackageAnalysis({ analysis }: { analysis: Analysis }) {
  const entrypoints = analysis.entrypoints;

  for (const k of Object.keys(entrypoints)) {
    console.log(k, entrypoints[k]);
  }

  return (
    <div>
      <h2>Package Analysis</h2>
      <p>{analysis.packageName}</p>
      <p>{analysis.packageVersion}</p>
      <p>{analysis.types}</p>
    </div>
  );
}

function UntypedPackage({ result }: { result: UntypedResult }) {
  return (
    <div>
      <h2>Untyped Package</h2>
      <p>{result.packageName}</p>
      <p>{result.packageVersion}</p>
      <p>{result.types}</p>
    </div>
  );
}

render(<App />, app);
