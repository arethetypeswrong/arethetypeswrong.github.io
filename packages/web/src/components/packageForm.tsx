import { useState, useEffect } from "react";
import type { ResultMessage } from "../../worker/worker";

export default function PackageForm() {
  const [packageName, setPackageName] = useState("");
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    // Create the worker once the component mounts
    const worker = new Worker(new URL("../worker/worker.ts", import.meta.url), { type: "module" });

    // setup the processing callback
    worker.onmessage = async (event: MessageEvent<ResultMessage>) => {
      console.log(event.data);
    };

    // setup the error callback
    worker.onerror = (event) => {
      console.error(event);
    };

    console.log("worker created", worker);

    // store the worker instance
    setWorker(worker);

    // terminate the worker once the component unmounts
    return worker.terminate();
  }, [setWorker]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!worker) {
      // component mounted but worker not ready yet
      console.error("worker not ready yet");
      return;
    }
    worker.postMessage({
      kind: "check-package",
      packageName: "lucid",
      version: "2.21.0",
    });
  };

  return (
    <div>
      <h1>Package Form</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input value={packageName} onChange={(e) => setPackageName(e.target.value)} type="text" id="name" />
        <button type="submit">Check Package</button>
      </form>
    </div>
  );
}
