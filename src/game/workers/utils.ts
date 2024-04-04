import { type ReturnsPromise } from "../utils";
import { jobs } from "./jobs";
import MinesweeperWorker from "./worker?worker";

const POOL_SIZE = 1;

const workers = new Set<Worker>();
const tempWorkers = new Set<Worker>();
const pool: Worker[] = [];

export const initWorkers = () => {
  while (workers.size < POOL_SIZE) {
    const worker = new MinesweeperWorker();
    workers.add(worker);
    pool.push(worker);
  }
};

export const destroyWorkers = () => {
  for (const worker of workers) {
    worker.terminate();
  }
  workers.clear();
  tempWorkers.clear();
  pool.splice(0, pool.length);
};

const getFreeWorker = () => {
  const worker = pool.pop();
  if (worker) return worker;

  const tempWorker = new MinesweeperWorker();
  workers.add(tempWorker);
  tempWorkers.add(tempWorker);
  return tempWorker;
};

export const callWorker = (name: string, args: unknown[]) =>
  new Promise((resolve, reject) => {
    const worker = getFreeWorker();

    const cleanup = () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);

      if (tempWorkers.has(worker)) {
        worker.terminate();
      } else {
        pool.push(worker);
      }
    };

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

    worker.postMessage({ name, args });
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
