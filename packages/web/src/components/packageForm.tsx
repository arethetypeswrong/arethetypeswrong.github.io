/**
 * This component is responsible for:
 * 1. Taking user input and parsing it into a package spec
 * 2. Fetching the package info from npm
 * 3. Updating the url query params with the package spec
 * 4. Sending uploaded files to the worker
 */
import { useState } from "react";
import type { CheckFileEventData, CheckPackageEventData } from "../../worker/worker";
import { parsePackageSpec, type ParsedPackageSpec } from "@arethetypeswrong/core/utils";
import type { Failable } from "@arethetypeswrong/core";
import { fetchPackageInfo } from "../utils/fetchPackageInfo";
import type { PackageInfo } from "../state";
import { useSearchParams } from "react-router-dom";

type PackageFormProps = {
  sendMessage: (message: CheckFileEventData | CheckPackageEventData) => void;
};

export default function PackageForm({ sendMessage }: PackageFormProps) {
  const [packageName, setPackageName] = useState("");
  const [parsedPackage, setParsedPackage] = useState<Failable<ParsedPackageSpec>>(parsePackageSpec(""));
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [_, setSearchParams] = useSearchParams();

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

    if (parsedPackage.status == "error") {
      // user needs to fix the package name before we can check it
      return;
    }

    // use the version from npm, or the user provided version, or default to latest
    const version = packageInfo?.version ?? parsedPackage.data.version ?? "latest";

    setSearchParams({ p: `${parsedPackage.data.packageName}@${version}` });
  };

  // On file upload, read the file and send it to the worker
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      sendMessage({
        kind: "check-file",
        file: data,
      });
    }
  };

  return (
    <form id="form" onSubmit={handleSubmit}>
      <label htmlFor="name">
        npm package{" "}
        <input
          type="text"
          id="package-spec"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          value={packageName}
          onChange={handleChange}
        />
      </label>
      <button id="check" type="submit" disabled={parsedPackage.status === "error"}>
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
