import { calculateProbabilities } from "../solver/probabilities";
import { solve } from "../solver/solve";
import type { State, WorkerJob } from "../types";
import { findGridWithMine } from "./fail-on-guess";
import { generateGrid } from "./generate-grid";

export const jobs = {
  calculateProbabilities,
  findGridWithMine(state: State, clickedIndex: number) {
    return { state: findGridWithMine(state, clickedIndex) };
  },
  solve(state: State) {
    const result = solve(state);
    return { ...result, state };
  },
  generateGrid,
} satisfies Record<string, WorkerJob>;
