import { State, Cell } from "./types";

export type ReturnsPromise<F extends (...args: any[]) => any> = (
  ...args: Parameters<F>
) => Promise<ReturnType<F>>;

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
  return state.grid[coordToIndex(state, x, y)];
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
  grid: state.grid.map((cell) => ({ ...cell, element: undefined })),
  mines: new Set(state.mines),
  elements: undefined,
  solver: undefined,
});

export const createCheckbox = (
  parent: HTMLElement,
  label: string,
  defaultChecked = false,
  isHidden = false
) => {
  const containerEl = document.createElement("div");
  containerEl.classList.add("container");
  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = defaultChecked;
  const id = label
    .replace(/^\W+|\W+$/g, "")
    .replace(/\W+/g, "-")
    .toLowerCase();
  labelEl.htmlFor = checkbox.id = id;
  containerEl.append(labelEl, checkbox);
  if (!isHidden) parent.append(containerEl);
  return checkbox;
};
