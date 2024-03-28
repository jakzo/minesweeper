import { calculateProbabilities } from "../solver/probabilities";
import { getDifficulty } from "../solver/solve";
import { WorkerJob } from "../types";

export const jobs = {
  calculateProbabilities,
  getDifficulty,
} satisfies Record<string, WorkerJob>;
