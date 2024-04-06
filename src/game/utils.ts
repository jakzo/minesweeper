import { type State, type Cell, type GameOptions, ChangeType } from "./types";

export const coordToIndex = (state: State, x: number, y: number) =>
  x + y * state.width;

export const indexToCoord = (state: State, index: number): [number, number] => [
  index % state.width,
  Math.floor(index / state.width),
];

export const getCell = (
  state: State,
  x: number,
  y: number
): Cell | undefined => {
  if (!isInBounds(state, x, y)) return undefined;
  return state.cells[coordToIndex(state, x, y)];
};

export const isInBounds = (state: State, x: number, y: number) =>
  x >= 0 && x < state.width && y >= 0 && y < state.height;

export function* neighbors(state: State, x: number, y: number) {
  for (let nx = x - 1; nx <= x + 1; nx++) {
    for (let ny = y - 1; ny <= y + 1; ny++) {
      const cell = getCell(state, nx, ny);
      if (cell) yield cell;
    }
  }
}

export const cloneState = (state: State): State => ({
  ...state,
  cells: cloneCells(state),
  mines: new Set(state.mines),
  moves: [...state.moves],
});

export const cloneCells = (state: State): Cell[] =>
  state.cells.map((cell) => ({ ...cell }));

export const resetState = (state: State) => {
  for (const cell of state.cells) {
    cell.isMine = cell.isRevealed = cell.isFlagged = false;
    cell.number = 0;
  }
  state.revealedCount = state.flagCount = 0;
  state.isWon = false;
  delete state.startTimeMs;
  delete state.stopTimeMs;
  delete state.solveResult;
  state.mines.clear();
};

export const initState = ({
  width,
  height,
  mineCount,
}: GameOptions): State => ({
  width,
  height,
  mineCount,
  cells: [...Array(width * height)].map((_, index): Cell => {
    const x = index % width;
    const y = Math.floor(index / width);
    return {
      index,
      x,
      y,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      number: 0,
    };
  }),
  mines: new Set(),
  flagCount: 0,
  revealedCount: 0,
  isWon: false,
  moves: [],
});

export const isStarted = (state: State) => state.revealedCount > 0;

export const isFinished = (state: State) => state.stopTimeMs !== undefined;

export const undo = (state: State) => {
  if (state.moves.length <= 1) return;
  const move = state.moves.pop()!;
  for (let i = move.changes.length - 1; i >= 0; i--) {
    const [index, type] = move.changes[i];
    const cell = state.cells[index]!;

    switch (type) {
      case ChangeType.REVEAL: {
        cell.isRevealed = false;
        state.revealedCount--;
        break;
      }

      case ChangeType.FLAG: {
        cell.isFlagged = false;
        state.flagCount--;
        break;
      }

      case ChangeType.UNFLAG: {
        cell.isFlagged = true;
        state.flagCount++;
        break;
      }

      case ChangeType.WIN:
      case ChangeType.LOSE: {
        state.isWon = false;
        state.stopTimeMs = undefined;
        break;
      }
    }
  }
};

export const debounce = (ms: number) => {
  let lastCallTs = 0;
  let isWaiting = false;
  return (fn: () => void) => {
    if (isWaiting) return;
    const now = Date.now();
    const elapsed = now - lastCallTs;
    if (elapsed >= ms) {
      lastCallTs = now;
      fn();
    } else {
      setTimeout(() => {
        lastCallTs = Date.now();
        isWaiting = false;
        fn();
      }, ms - elapsed);
      isWaiting = true;
    }
  };
};
