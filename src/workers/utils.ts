import { ReturnsPromise } from "../utils";
import { jobs } from "./jobs";

const POOL_SIZE = 1;

const workers = new Set<Worker>();
const tempWorkers = new Set<Worker>();
const pool: Worker[] = [];

export const initWorkers = () => {
  while (workers.size < POOL_SIZE) {
    const worker = createWorker();
    workers.add(worker);
    pool.push(worker);
  }
};

const createWorker = () => {
  const workerUrl = new URL("worker.js", import.meta.url);
  return new Worker(workerUrl, { type: "module" });
};

const getFreeWorker = () => {
  const worker = pool.pop();
  if (worker) return worker;

  const tempWorker = createWorker();
  workers.add(tempWorker);
  tempWorkers.add(tempWorker);
  return tempWorker;
};

export const callWorker = (name: string, args: unknown[]) =>
  new Promise((resolve, reject) => {
    const worker = getFreeWorker();

    const onMessage = (evt: MessageEvent<unknown>) => {
      cleanup();
      resolve(evt.data);
    };
    const onError = (evt: ErrorEvent) => {
      cleanup();
      reject(evt.error);
    };

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);

    const cleanup = () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);

      if (tempWorkers.has(worker)) {
        worker.terminate();
      } else {
        pool.push(worker);
      }
    };

    worker.postMessage({
      name,
      args: JSON.stringify(args, (key, value) =>
        key === "elements" || key === "element" ? undefined : value
      ),
    });
  });

export type WorkerClient = {
  [K in keyof typeof jobs]: ReturnsPromise<(typeof jobs)[K]>;
};

export const workerClient = Object.fromEntries(
  Object.keys(jobs).map((name) => [
    name,
    (...args: unknown[]) => callWorker(name, args),
  ])
) as WorkerClient;
