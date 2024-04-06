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

export const terminateWorker = (worker: Worker) => {
  worker.terminate();
  workers.delete(worker);
  tempWorkers.delete(worker);
  const poolIdx = pool.indexOf(worker);
  if (poolIdx !== -1) pool.splice(poolIdx, 1);
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

export const callWorker = (name: string, args: unknown[]) => {
  const worker = getFreeWorker();

  const promise = new Promise((resolve, reject) => {
    const cleanup = () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);

      if (tempWorkers.has(worker)) {
        worker.terminate();
        tempWorkers.delete(worker);
      } else {
        pool.push(worker);
      }
    };

    const onMessage = (evt: MessageEvent<{ result?: unknown }>) => {
      if (evt.data?.result) {
        cleanup();
        resolve(evt.data.result);
      } else {
        promise.onMessage?.(evt);
      }
    };
    const onError = (evt: ErrorEvent) => {
      cleanup();
      reject(evt.error);
    };

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);

    worker.postMessage({ type: "job", name, args });
  }) as WorkerPromise<unknown>;

  promise.worker = worker;
  promise.cancel = () => {
    terminateWorker(worker);
    initWorkers();
  };

  return promise;
};

export type WorkerPromise<T> = Promise<T> & {
  worker: Worker;
  cancel: () => void;
  onMessage?: (evt: MessageEvent) => void;
};

export type ReturnsWorkerPromise<F extends (...args: any[]) => any> = (
  ...args: Parameters<F>
) => WorkerPromise<ReturnType<F>>;

export type WorkerClient = {
  [K in keyof typeof jobs]: ReturnsWorkerPromise<(typeof jobs)[K]>;
};

export const workerClient = Object.fromEntries(
  Object.keys(jobs).map((name) => [
    name,
    (...args: unknown[]) => callWorker(name, args),
  ])
) as WorkerClient;
