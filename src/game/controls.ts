import { getDifficulty } from "../solver/solve";
import { State } from "../types";
import { getCell, indexToCoord, neighbors } from "../utils";

export const revealCell = (state: State, x: number, y: number) => {
  const cell = getCell(state, x, y);
  if (!cell || cell.isRevealed || cell.isFlagged) return;

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
  if (state.revealedCount === 0) return;

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

export const decideMinePositions = (state: State, sx: number, sy: number) => {
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
    state.mines.add(mineIdx);

    if (remainingCells.length > 1) remainingCells[idx] = remainingCells.pop()!;
    else remainingCells.pop();
  }

  for (const cell of state.grid) {
    cell.number = 0;
    for (const neighbor of neighbors(state, cell.x, cell.y)) {
      if (neighbor.isMine) cell.number++;
    }
    if (!cell.isMine) {
      cell.element?.classList.add(`n${cell.number}`);
    }
  }
};

export const decideMinePositionsSolvable = async (
  state: State,
  sx: number,
  sy: number
) => {
  const minDifficulty =
    +(state.solver?.elements?.minDifficulty.value ?? "0") || 0;

  let difficulty: number | undefined;
  do {
    for (const cell of state.grid) {
      cell.isMine = cell.isRevealed = false;
      cell.number = 0;
      cell.element?.classList.remove(
        "mine",
        ...[...Array(10).keys()].map((i) => `n${i}`)
      );
      cell.element?.classList.add("hidden");
    }
    state.revealedCount = 0;
    state.mines.clear();

    decideMinePositions(state, sx, sy);
    revealCell(state, sx, sy);

    difficulty = getDifficulty(state);
    console.log("=== dif", difficulty);

    await new Promise((resolve) => setTimeout(resolve, 0));
  } while (!difficulty || difficulty < minDifficulty);

  return difficulty;
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
