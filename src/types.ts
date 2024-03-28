import type { jobs } from "./workers/jobs";

export interface Cell {
  index: number;
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  number: number;
  element?: HTMLDivElement;
}

export interface State {
  width: number;
  height: number;
  mineCount: number;
  showSolverForm: boolean;
  grid: Cell[];
  mines: Set<number>;
  flagCount: number;
  revealedCount: number;
  isFinished: boolean;
  isWon: boolean;
  elements?: {
    parent: HTMLElement;
    forms: HTMLDivElement;
    mineCount: HTMLSpanElement;
    winText: HTMLSpanElement;
    grid: HTMLDivElement;
  };
  solver?: {
    elements?: {
      showProbabilities: HTMLButtonElement;
      minDifficulty: HTMLInputElement;
      probabilitiesEveryMove: HTMLInputElement;
      guessesAlwaysSucceed: HTMLInputElement;
      ensureSolvable: HTMLInputElement;
    };
  };
}

export interface WorkerMessage {
  name: keyof typeof jobs;
  state: State;
  args: string;
}

export type WorkerJob = (state: State, ...args: unknown[]) => unknown;
