import { calculateProbabilities } from "../solver/probabilities";
import { solve } from "../solver/solve";
import type { State, WorkerJob } from "../types";
import { generateGrid } from "./generate-grid";

export const jobs = {
  calculateProbabilities,
  solve(state: State) {
    const result = solve(state);
    return { ...result, state };
  },
  generateGrid,
} satisfies Record<string, WorkerJob>;
