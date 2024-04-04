import {
  type State,
  type Cell,
  ChangeType,
  type Changes,
  type Move,
} from "./types";
import { indexToCoord, neighbors, resetState } from "./utils";

export const clickCell = (
  state: State,
  cell: Cell,
  isFlag: boolean
): Move | undefined => {
  const makeChanges = (): [ChangeType, Changes] => {
    if (isFlag) {
      if (cell.isFlagged) {
        return [ChangeType.UNFLAG, unflagCell(state, cell)];
      } else {
        return [ChangeType.FLAG, flagCell(state, cell)];
      }
    } else {
      return [ChangeType.REVEAL, revealCell(state, cell)];
    }
  };

  const [type, changes] = makeChanges();
  if (changes.length === 0) return undefined;

  const move = {
    timeMs: Date.now(),
    index: cell.index,
    type,
    changes,
  };
  state.moves.push(move);
  return move;
};

export const revealCell = (state: State, cell: Cell): Changes => {
  const changes: Changes = [];

  if (cell.isRevealed || cell.isFlagged) return changes;

  if (!state.startTimeMs) state.startTimeMs = Date.now();

  const reveal = (cell: Cell) => {
    if (cell.isRevealed) return;

    if (cell.isFlagged) changes.push(...unflagCell(state, cell));

    cell.isRevealed = true;
    state.revealedCount++;
    changes.push([cell.index, ChangeType.REVEAL]);

    if (cell.number === 0 && !cell.isMine) {
      for (const neighbor of neighbors(state, cell.x, cell.y)) {
        reveal(neighbor);
      }
    }
  };

  reveal(cell);

  if (cell.isMine) {
    state.stopTimeMs = Date.now();
    changes.push([cell.index, ChangeType.LOSE]);
    return changes;
  }

  if (
    state.revealedCount >= state.width * state.height - state.mineCount &&
    !state.stopTimeMs
  ) {
    state.isWon = true;
    state.stopTimeMs = Date.now();
    changes.push([cell.index, ChangeType.WIN]);
  }

  return changes;
};

export const flagCell = (state: State, cell: Cell): Changes => {
  if (cell.isFlagged) return [];
  cell.isFlagged = true;
  state.flagCount++;
  return [[cell.index, ChangeType.FLAG]];
};

export const unflagCell = (state: State, cell: Cell): Changes => {
  if (!cell.isFlagged) return [];
  cell.isFlagged = false;
  state.flagCount--;
  return [[cell.index, ChangeType.UNFLAG]];
};

export const decideMinePositionsRandom = (
  state: State,
  sx: number,
  sy: number
) => {
  const cellCount = state.width * state.height;
  const remainingCells = [...Array(cellCount).keys()].filter((_, index) => {
    const [x, y] = indexToCoord(state, index);
    return Math.abs(x - sx) > 1 || Math.abs(y - sy) > 1;
  });
  if (remainingCells.length < state.mineCount)
    throw new Error("Not enough free cells to place mines in");

  for (let i = 0; i < state.mineCount; i++) {
    const idx = Math.floor(Math.random() * remainingCells.length);

    const mineIdx = remainingCells[idx];
    const cell = state.cells[mineIdx];
    cell.isMine = true;
    state.mines.add(cell.index);

    if (idx < remainingCells.length - 1) {
      remainingCells[idx] = remainingCells.pop()!;
    } else {
      remainingCells.pop()!;
    }
  }

  for (const cell of state.cells) {
    cell.number = 0;
    for (const neighbor of neighbors(state, cell.x, cell.y)) {
      if (neighbor.isMine) cell.number++;
    }
  }
};

export const decideMinePositionsWhere = async (
  state: State,
  sx: number,
  sy: number,
  predicate: (
    state: State,
    sx: number,
    sy: number
  ) => Promise<boolean> | boolean
) => {
  do {
    await new Promise((resolve) => setTimeout(resolve, 0));
    resetState(state);
    decideMinePositionsRandom(state, sx, sy);
  } while (!(await predicate(state, sx, sy)));
};
