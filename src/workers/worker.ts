import { WorkerJob, WorkerMessage } from "../types";
import { jobs } from "./jobs";

self.addEventListener("message", (evt) => {
  const { name, state, args } = evt.data as WorkerMessage;
  const job = jobs[name];
  if (!job) throw new Error(`Unknown job name: ${name}`);

  const result = (job as WorkerJob)(state, ...args);
  postMessage(result);
});
