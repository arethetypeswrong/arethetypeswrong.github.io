import { open, appendFile } from "fs/promises";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { checkPackage } from "@arethetypeswrong/core";
import type { Blob } from "./types.ts";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function postBlob(blob: Blob) {
  if (isMainThread) {
    throw new Error("This function must be called from a worker thread.");
  }

  parentPort!.postMessage(blob);
}

if (!isMainThread && parentPort) {
  parentPort.on("message", async ({ packageName, packageVersion, index }) => {
    let tries = 0;
    while (true) {
      try {
        const analysis = await checkPackage(packageName, packageVersion);
        postBlob({
          kind: "analysis",
          workerId: workerData.workerId,
          index,
          data: analysis,
        });
      } catch (error) {
        await sleep(1000 * tries ** 2);
        if (tries++ > 3) {
          postBlob({
            kind: "error",
            workerId: workerData.workerId,
            index,
            packageName,
            packageVersion,
            message: "" + (error as Error)?.message,
          });
          break;
        }
      }
    }
  });
}

export function checkPackages(
  packages: { packageName: string; packageVersion: string }[],
  outFile: URL,
  workerCount: number
) {
  if (!isMainThread) {
    throw new Error("This function must be called from the main thread.");
  }

  const workers = Array.from({ length: workerCount }, (_, i) => {
    return new Worker(new URL(import.meta.url), { workerData: { workerId: i } });
  });

  return new Promise<void>(async (resolve, reject) => {
    const fh = await open(outFile, "w");
    const packagesDonePerWorker = new Array(workerCount).fill(0);
    const workQueue: { packageName: string; packageVersion: string; index?: number }[] = [...packages];
    let finishedWorkers = 0;
    for (const worker of workers) {
      worker.on("message", async (blob: Blob) => {
        const workerIndex = workers.indexOf(worker);
        packagesDonePerWorker[workerIndex]++;
        await appendFile(fh, JSON.stringify(blob) + "\n");
        if (blob.kind === "error") {
          console.error(`[${workerIndex}] ${blob.packageName}@${blob.packageVersion}: ${blob.message}`);
          workQueue.push({
            packageName: blob.packageName,
            packageVersion: blob.packageVersion,
            index: blob.index,
          });
        } else {
          console.log(
            `[${workerIndex}] ${packages.length - workQueue.length}/${packages.length} ${blob.data.packageName}@${
              blob.data.packageVersion
            }`
          );
        }

        if (workQueue.length > 0) {
          const next = workQueue.shift()!;
          const index = next.index ?? packages.indexOf(next);
          worker.postMessage({ ...next, index });
        } else {
          worker.terminate();
          finishedWorkers++;

          if (finishedWorkers === workers.length) {
            resolve();
          }
        }
      });

      worker.once("error", (error) => {
        workers.forEach((worker) => worker.terminate());
        reject(error);
      });

      const nextPackage = workQueue.shift();
      if (nextPackage) {
        worker.postMessage({ ...nextPackage, index: packages.indexOf(nextPackage) });
      }
    }

    process.on("SIGINT", () => {
      workers.forEach((worker) => worker.terminate());
      reject(new Error("SIGINT"));
    });
  });
}
