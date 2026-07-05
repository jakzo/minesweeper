import { jobs } from "./jobs";
import MinesweeperWorker from "./worker?worker";

const workers = new Set<Worker>();
const tempWorkers = new Set<Worker>();
const pool: Worker[] = [];

const getPoolSize = () =>
  Math.max(
    1,
    typeof navigator === "undefined" ? 1 : navigator.hardwareConcurrency || 1
  );

export const initWorkers = () => {
  while (workers.size < getPoolSize()) {
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

    const onMessage = (
      evt: MessageEvent<{ result?: unknown; error?: string }>
    ) => {
      if (evt.data?.result) {
        cleanup();
        resolve(evt.data.result);
      } else if (evt.data?.error) {
        cleanup();
        reject(evt.data.error);
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
) => WorkerPromise<Awaited<ReturnType<F>>>;

export type WorkerClient = {
  [K in keyof typeof jobs]: ReturnsWorkerPromise<(typeof jobs)[K]>;
};

export const workerClient = Object.fromEntries(
  Object.keys(jobs).map((name) => [
    name,
    (...args: unknown[]) => callWorker(name, args),
  ])
) as WorkerClient;

type GenerateGridStatus = {
  numGeneratedGrids: number;
  generatedDifficultyMin: number;
  generatedDifficultyMax: number;
};

export const generateGridInParallel = (
  ...args: Parameters<typeof jobs.generateGrid>
) => {
  const workerPromises = Array.from({ length: getPoolSize() }, () =>
    workerClient.generateGrid(...args)
  );
  const statuses = new Map<number, GenerateGridStatus>();
  let isSettled = false;
  let failedWorkers = 0;

  const promise = new Promise<Awaited<ReturnType<typeof jobs.generateGrid>>>(
    (resolve, reject) => {
      workerPromises.forEach((workerPromise, index) => {
        workerPromise.onMessage = (evt) => {
          if (isSettled || !evt.data?.numGeneratedGrids) return;

          statuses.set(index, evt.data);
          const currentStatuses = [...statuses.values()];
          const difficultyMins = currentStatuses
            .map((status) => status.generatedDifficultyMin)
            .filter((difficulty) => difficulty > 0);

          promise.onMessage?.({
            data: {
              numGeneratedGrids: currentStatuses.reduce(
                (total, status) => total + status.numGeneratedGrids,
                0
              ),
              generatedDifficultyMin:
                difficultyMins.length > 0 ? Math.min(...difficultyMins) : 0,
              generatedDifficultyMax: Math.max(
                0,
                ...currentStatuses.map(
                  (status) => status.generatedDifficultyMax
                )
              ),
            },
          } as MessageEvent<GenerateGridStatus>);
        };

        workerPromise.then(
          (result) => {
            if (isSettled) return;
            isSettled = true;
            for (const otherPromise of workerPromises) {
              if (otherPromise !== workerPromise) otherPromise.cancel();
            }
            resolve(result);
          },
          (error) => {
            failedWorkers++;
            if (!isSettled && failedWorkers === workerPromises.length) {
              isSettled = true;
              reject(error);
            }
          }
        );
      });
    }
  ) as WorkerPromise<Awaited<ReturnType<typeof jobs.generateGrid>>>;

  // A parallel job owns several workers, so there is no single useful worker.
  promise.worker = workerPromises[0].worker;
  promise.cancel = () => {
    if (isSettled) return;
    isSettled = true;
    for (const workerPromise of workerPromises) workerPromise.cancel();
  };

  return promise;
};
