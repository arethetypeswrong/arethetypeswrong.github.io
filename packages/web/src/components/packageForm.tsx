/**
 * This component is responsible for:
 * 1. Setting up the web worker
 * 2. Taking user input and parsing it into a package spec
 * 3. Fetching the package info from npm
 * 4. Lifting package analysis to the parent component
 */
import { useState, useEffect } from "react";
import type { ResultMessage } from "../../worker/worker";
import { parsePackageSpec, type ParsedPackageSpec } from "@arethetypeswrong/core/utils";
import type { Failable } from "@arethetypeswrong/core";
import { fetchPackageInfo } from "../utils/fetchPackageInfo";
import type { PackageInfo } from "../state";

const workerURL = new URL("../../worker/worker.ts", import.meta.url);

type PackageFormProps = {
  setPackageAnalysis: (analysis: ResultMessage) => void;
};

export default function PackageForm({ setPackageAnalysis }: PackageFormProps) {
  const [packageName, setPackageName] = useState("");
  const [parsedPackage, setParsedPackage] = useState<Failable<ParsedPackageSpec>>(parsePackageSpec(""));
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    // Create the worker once the component mounts
    const worker = new Worker(workerURL, { type: "module" });

    // setup the processing callback
    worker.onmessage = async (event: MessageEvent<ResultMessage>) => {
      setPackageAnalysis(event.data);
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

  // Save the package string and parse it into a package spec
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const parsedPackage = parsePackageSpec(input);

    // update component state
    setPackageName(input);
    setParsedPackage(parsedPackage);

    // fetch the package info from npm if the package spec is valid
    if (parsedPackage.status == "success") {
      fetchPackageInfo(parsedPackage.data)
        .then((info) => {
          setPackageInfo(info);
        })
        .catch(() => {
          setPackageInfo(null);
        });
    }
  };

  // On click send the package spec to the worker
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

  // On file upload, read the file and send it to the worker
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (worker == null) {
      return;
    }
    const file = e.target.files?.[0];

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      worker.postMessage({
        kind: "check-file",
        file: data,
      });
    }
  };

  return (
    <form id="form" onSubmit={handleSubmit}>
      <label htmlFor="name">
        npm package <input value={packageName} onChange={handleChange} type="text" id="name" />
      </label>
      <button id="check" type="submit" disabled={worker === null || parsedPackage.status === "error"}>
        Check
      </button>
      <p>
        or <code>npm pack</code> output{" "}
        <input onChange={handleFileUpload} name="file" type="file" id="file" accept=".tgz"></input>
      </p>
      {packageName !== "" && <PreFetchInfo spec={parsedPackage} info={packageInfo} />}
    </form>
  );
}

type PreFetchInfoProps = {
  spec: Failable<ParsedPackageSpec>;
  info: PackageInfo | null;
};

function PreFetchInfo({ spec, info }: PreFetchInfoProps) {
  // package is not a valid format
  if (spec.status == "error") {
    return <p style={{ color: "red" }}>{spec.error}</p>;
  }

  // npm package found, may or may not have a size
  if (info) {
    return info.size ? <p>Checking will stream {info.size} bytes</p> : <p>Checking will stream the tarball</p>;
  }

  return <p>Package not found</p>;
}
