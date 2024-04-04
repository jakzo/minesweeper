import { calculateProbabilities } from "../solver/probabilities";
import { solve } from "../solver/solve";
import type { State, WorkerJob } from "../types";

export const jobs = {
  calculateProbabilities,
  solve: (state: State) => {
    const result = solve(state);
    return { ...result, state };
  },
} satisfies Record<string, WorkerJob>;
