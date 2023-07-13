import type { ResultMessage } from "../../worker/worker";
import PackageAnalysis from "./packageAnalysis";
import UntypedPackage from "./untypedPackage";
import PackageForm from "./packageForm";
import { useSearchParams } from "react-router-dom";
import { usePackageAnalysisWorker } from "../hooks/packageAnalysisWorker";
import { parsePackageSpec } from "@arethetypeswrong/core/utils";
import { useEffect } from "react";

const workerURL = new URL("../../worker/worker.ts", import.meta.url);

export default function Main() {
  const [searchParams] = useSearchParams();
  const { analysis, sendMessage, ready } = usePackageAnalysisWorker(workerURL);

  const packageName = searchParams.get("p");

  useEffect(() => {
    if (!packageName) {
      return;
    }

    const spec = parsePackageSpec(packageName);

    if (spec.status === "success") {
      sendMessage({
        kind: "check-package",
        packageName: spec.data.packageName,
        version: spec.data.version ?? "latest",
      });
    }
  }, [packageName, ready]);

  return (
    <main>
      <div id="header">
        <h1>Are the types wrong?</h1>
        <a href="https://github.com/arethetypeswrong/arethetypeswrong.github.io">GitHub / About</a>
      </div>
      <PackageForm sendMessage={sendMessage} />
      {analysis && <CheckResult resultMessage={analysis} />}
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
