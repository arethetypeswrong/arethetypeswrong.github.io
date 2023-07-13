// This hook encapsulates the logic for creating a web worker, sending messages to it and receiving the result from it.

import { useEffect, useState } from "react";
import type { CheckFileEventData, CheckPackageEventData, ReadyMessage, ResultMessage } from "../../worker/worker";
import { set } from "nprogress";

export const usePackageAnalysisWorker = (workerURL: URL) => {
  const [analysis, setAnalysis] = useState<ResultMessage | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    // Create the worker once the component mounts
    const worker = new Worker(workerURL, { type: "module" });

    // setup the processing callback
    worker.onmessage = async (event: MessageEvent<ResultMessage | ReadyMessage>) => {
      if (event.data.kind === "ready") {
        setReady(true);
      }

      if (event.data.kind === "result") {
        setAnalysis(event.data);
      }
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
  }, [workerURL]);

  const sendMessage = (message: CheckFileEventData | CheckPackageEventData) => {
    if (worker) {
      worker.postMessage(message);
    } else {
      console.info("Worker not ready");
    }
  };

  return { analysis, sendMessage, ready };
};
