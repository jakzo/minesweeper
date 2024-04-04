import type { solveStepByStep } from "./solver/solve";
import type { jobs } from "./workers/jobs";

export interface GameOptions {
  width: number;
  height: number;
  mineCount: number;
}

export interface SolverGameOptions {
  ensureSolvable: boolean;
  minimumDifficulty: number;
}

export interface SolveResult {
  difficulty?: number;
}

export interface State {
  width: number;
  height: number;
  mineCount: number;
  startingCell?: number;
  cells: Cell[];
  mines: Set<number>;
  flagCount: number;
  revealedCount: number;
  isWon: boolean;
  moves: Move[];
  startTimeMs?: number;
  stopTimeMs?: number;
  solveResult?: SolveResult;
}

export interface Cell {
  index: number;
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  number: number;
}

export type Move = {
  timeMs: number;
  index: number;
  type: ChangeType;
  changes: Changes;
};

export enum ChangeType {
  FLAG,
  UNFLAG,
  REVEAL,
  WIN,
  LOSE,
}

export type Changes = [number, ChangeType][];

export type Probabilities = Map<number, number>;

export type SolverStep = NonNullable<
  ReturnType<ReturnType<typeof solveStepByStep>["next"]>["value"]
>;

export interface WorkerMessage {
  name: keyof typeof jobs;
  args: string;
}

export type WorkerJob = (...args: any[]) => unknown;
