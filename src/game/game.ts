import { State } from "../types";
import { getCell } from "../utils";
import {
  initSolverForm,
  onAfterMove,
  onBeforeMove,
  resetSolver,
} from "../solver/form";
import { initGameForm } from "./form";
import { flagCell, revealCell } from "./controls";
import { workerClient } from "../workers/utils";

export const startGame = (
  width: number,
  height: number,
  mineCount: number,
  parent: HTMLElement,
  showSolverForm = false
): State => {
  const state = initState(width, height, mineCount, showSolverForm);

  createElements(state, parent, (x, y, isFlag) => {
    if (isFlag) flagCell(state, x, y);
    else chooseCell(state, x, y);
    onAfterMove(state);
    resetSolver();
  });
  updateMineCount(state);
  parent.append(state.elements!.forms, state.elements!.grid);

  return state;
};

export const initState = (
  width: number,
  height: number,
  mineCount: number,
  showSolverForm = false
): State => ({
  width,
  height,
  mineCount,
  showSolverForm,
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
  parent: HTMLElement,
  onClick: (x: number, y: number, isFlag: boolean) => void
) => {
  const forms = document.createElement("div");
  forms.classList.add("forms");

  const mineCount = document.createElement("span");
  mineCount.classList.add("mine-count");

  const winText = document.createElement("span");
  winText.classList.add("win", "hide");
  winText.textContent = "You win!";
  forms.append(" ", winText);

  const grid = document.createElement("div");
  grid.classList.add("grid", "playing");

  for (let y = 0; y < state.height; y++) {
    const row = document.createElement("div");
    row.classList.add("row");
    for (let x = 0; x < state.width; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell", "hidden");
      cell.addEventListener("contextmenu", (evt) => evt.preventDefault());
      cell.addEventListener("mousedown", async (evt) => {
        evt.preventDefault();
        if (evt.button === 0) {
          const isFirstMove = state.revealedCount === 0;
          onClick(x, y, false);
          if (isFirstMove) {
            const difficulty = await workerClient.getDifficulty(state);
            difficultyEl.textContent =
              difficulty !== undefined ? difficulty.toFixed(1) : "unsolvable";
          }
        } else if (evt.button === 2) onClick(x, y, true);
      });
      row.append(cell);
      state.grid[y][x].element = cell;
    }
    grid.append(row);
  }

  state.elements = { parent, forms, mineCount, winText, grid };

  initGameForm(state);
  if (state.showSolverForm) initSolverForm(state);

  const difficultyEl = document.createElement("span");

  forms.append("Mine count: ", mineCount, ", Difficulty: ", difficultyEl);
};

const updateMineCount = (state: State) => {
  if (!state.elements) return;
  state.elements.mineCount.textContent = (
    state.mineCount - state.flagCount
  ).toString();
};

const chooseCell = async (state: State, x: number, y: number) => {
  const cell = getCell(state, x, y);
  cell?.element?.classList.add("loading");

  await onBeforeMove(state, x, y);

  cell?.element?.classList.remove("loading");
  revealCell(state, x, y);
};
