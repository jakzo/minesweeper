import type { WorkerJob, WorkerMessage } from "../types";
import { jobs } from "./jobs";

self.addEventListener("message", async (evt) => {
  if (evt.data?.type !== "job") return;

  const { name, args } = evt.data as WorkerMessage;
  const job = jobs[name];
  if (!job) throw new Error(`Unknown job name: ${name}`);

  try {
    const result = await (job as WorkerJob)(...args);
    postMessage({ result });
  } catch (err) {
    postMessage({ error: String(err) });
  }
});
