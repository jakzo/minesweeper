import { State } from "./types";
import { indexToCoord, getCell, neighbors } from "./utils";
import { initHud, onMove } from "./solver/hud";

export const startGame = (
  width: number,
  height: number,
  mineCount: number,
  parent: HTMLElement,
  showSolverHud = false
): State => {
  const state = initState(width, height, mineCount, showSolverHud);

  createElements(state, (x, y, isFlag) => {
    if (isFlag) flagCell(state, x, y);
    else chooseCell(state, x, y);
  });
  updateMineCount(state);
  parent.append(state.elements!.hud, state.elements!.grid);

  return state;
};

export const initState = (
  width: number,
  height: number,
  mineCount: number,
  showSolverHud = false
): State => ({
  width,
  height,
  mineCount,
  showSolverHud,
  grid: [...Array(height)].map((_, y) =>
    [...Array(width)].map((_, x) => ({
      index: x + y * width,
      x,
      y,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      number: 0,
    }))
  ),
  mines: new Set(),
  flagCount: 0,
  revealedCount: 0,
  isFinished: false,
  isWon: false,
});

const createElements = (
  state: State,
  onClick: (x: number, y: number, isFlag: boolean) => void
) => {
  const hud = document.createElement("div");
  hud.classList.add("hud");

  const mineCount = document.createElement("span");
  mineCount.classList.add("mine-count");
  hud.append("Mine count: ", mineCount);

  const winText = document.createElement("span");
  winText.classList.add("win", "hide");
  winText.textContent = "You win!";
  hud.append(" ", winText);

  const grid = document.createElement("div");
  grid.classList.add("grid", "playing");

  for (let y = 0; y < state.height; y++) {
    const row = document.createElement("div");
    row.classList.add("row");
    for (let x = 0; x < state.width; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell", "hidden");
      cell.addEventListener("contextmenu", (evt) => evt.preventDefault());
      cell.addEventListener("mousedown", (evt) => {
        evt.preventDefault();
        if (evt.button === 0) onClick(x, y, false);
        else if (evt.button === 2) onClick(x, y, true);
      });
      row.append(cell);
      state.grid[y][x].element = cell;
    }
    grid.append(row);
  }

  state.elements = { hud, mineCount, winText, grid };

  if (state.showSolverHud) initHud(state);
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

    remainingCells[idx] = remainingCells.pop()!;
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

const updateMineCount = (state: State) => {
  if (!state.elements) return;
  state.elements.mineCount.textContent = (
    state.mineCount - state.flagCount
  ).toString();
};

const chooseCell = (state: State, x: number, y: number) => {
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
      chooseCell(state, neighbor.x, neighbor.y);
    }
  }

  checkWin(state);
  onMove(state);
};

const flagCell = (state: State, x: number, y: number) => {
  const cell = getCell(state, x, y);
  if (!cell || cell.isRevealed) return;

  cell.isFlagged = !cell.isFlagged;
  cell.element?.classList.toggle("flag", cell.isFlagged);
  state.flagCount += cell.isFlagged ? 1 : -1;
  updateMineCount(state);
  onMove(state);
};

const checkWin = (state: State) => {
  if (
    state.revealedCount >= state.width * state.height - state.mineCount &&
    !state.isFinished
  ) {
    state.isFinished = state.isWon = true;
    state.elements?.winText.classList.remove("hide");
  }
};
