import type { WorkerJob, WorkerMessage } from "../types";
import { jobs } from "./jobs";

self.addEventListener("message", (evt) => {
  const { name, args } = evt.data as WorkerMessage;
  const job = jobs[name];
  if (!job) throw new Error(`Unknown job name: ${name}`);

  const result = (job as WorkerJob)(...args);
  postMessage(result);
});