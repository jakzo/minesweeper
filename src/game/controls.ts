import { State } from "../types";
import { getCell, indexToCoord, neighbors } from "../utils";

export const revealCell = (state: State, x: number, y: number) => {
  const cell = getCell(state, x, y);
  if (!cell || cell.isRevealed || cell.isFlagged) return;

  if (state.revealedCount === 0) decideMinePositions(state, x, y);

  if (cell.isMine) {
    state.isFinished = true;
    state.elements?.grid.classList.remove("playing");
    return;
  }

  cell.isRevealed = true;
  cell.element?.classList.remove("hidden");
  state.revealedCount++;
  if (cell.number === 0) {
    for (const neighbor of neighbors(state, x, y)) {
      revealCell(state, neighbor.x, neighbor.y);
    }
  }

  checkWin(state);
};

export const flagCell = (state: State, x: number, y: number) => {
  const cell = getCell(state, x, y);
  if (!cell || cell.isRevealed) return;

  cell.isFlagged = !cell.isFlagged;
  cell.element?.classList.toggle("flag", cell.isFlagged);
  state.flagCount += cell.isFlagged ? 1 : -1;

  updateMineCount(state);
  checkWin(state);
};

const updateMineCount = (state: State) => {
  if (!state.elements) return;
  state.elements.mineCount.textContent = (
    state.mineCount - state.flagCount
  ).toString();
};

const decideMinePositions = (state: State, sx: number, sy: number) => {
  // TODO: Ensure solvable
  const remainingCells = [...Array(state.width * state.height).keys()].filter(
    (_, i) => {
      const [x, y] = indexToCoord(state, i);
      return Math.abs(x - sx) > 1 || Math.abs(y - sy) > 1;
    }
  );
  for (let i = 0; i < state.mineCount; i++) {
    if (remainingCells.length === 0)
      throw new Error("Not enough free cells to place mines in");
    const idx = Math.floor(Math.random() * remainingCells.length);

    const mineIdx = remainingCells[idx];
    const [x, y] = indexToCoord(state, mineIdx);
    const cell = getCell(state, x, y)!;
    cell.isMine = true;
    cell.element?.classList.add("mine");

    if (remainingCells.length > 1) remainingCells[idx] = remainingCells.pop()!;
    else remainingCells.pop();
  }

  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const cell = getCell(state, x, y)!;
      cell.number = 0;
      for (const neighbor of neighbors(state, x, y)) {
        if (neighbor.isMine) cell.number++;
      }
      if (!cell.isMine) {
        cell.element?.classList.add(`n${cell.number}`);
      }
    }
  }
};

export const checkWin = (state: State) => {
  if (
    state.revealedCount >= state.width * state.height - state.mineCount &&
    !state.isFinished
  ) {
    state.isFinished = state.isWon = true;
    state.elements?.winText.classList.remove("hide");
  }
};
