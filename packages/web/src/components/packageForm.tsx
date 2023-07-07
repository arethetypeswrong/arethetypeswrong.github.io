import { useState, useEffect } from "react";
import type { ResultMessage } from "../../worker/worker";
import { parsePackageSpec, type ParsedPackageSpec } from "@arethetypeswrong/core/utils";
import type { Failable } from "@arethetypeswrong/core";

const workerURL = new URL("../../worker/worker.ts", import.meta.url);

export default function PackageForm() {
  const [packageName, setPackageName] = useState("");
  const [parsedPackage, setParsedPackage] = useState<Failable<ParsedPackageSpec>>(parsePackageSpec(""));
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    // Create the worker once the component mounts
    const worker = new Worker(workerURL, { type: "module" });

    // setup the processing callback
    worker.onmessage = async (event: MessageEvent<ResultMessage>) => {
      console.log(event.data);
    };

    // setup the error callback
    worker.onerror = (event) => {
      console.error(event);
    };

    // store the worker instance
    setWorker(worker);

    // terminate the worker once the component unmounts
    return () => {
      worker.terminate();
    };
  }, [setWorker]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPackageName(e.target.value);
    setParsedPackage(parsePackageSpec(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (worker == null) {
      // Unlikely the user will submit before the worker is ready, but just in case...
      return;
    }

    if (parsedPackage.status == "error") {
      // user needs to fix the package name before we can check it
      return;
    }

    worker.postMessage({
      kind: "check-package",
      packageName: parsedPackage.data.packageName,
      version: parsedPackage.data.version,
    });
  };

  return (
    <div>
      <h1>Package Form</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">
          Package Name
          <input value={packageName} onChange={handleChange} type="text" id="name" />
        </label>
        <ErrorMessage {...parsedPackage} />
        <button type="submit" disabled={worker === null || parsedPackage.status === "error"}>
          Check Package
        </button>
      </form>
    </div>
  );
}

function ErrorMessage(parsedPackage: Failable<ParsedPackageSpec>) {
  if (parsedPackage.status == "error") {
    return <p style={{ color: "red" }}>{parsedPackage.error}</p>;
  }
  return null;
}
