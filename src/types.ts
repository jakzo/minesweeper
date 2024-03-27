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
  grid: Cell[][];
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
      probabilitiesEveryMove: HTMLInputElement;
      guessesAlwaysSucceed: HTMLInputElement;
    };
  };
}

export interface WorkerMessage {
  name: keyof typeof jobs;
  args: string;
}
