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

export const getCell = (state: State, x: number, y: number): Cell | undefined =>
  state.grid[y]?.[x];

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
  grid: state.grid.map((row) =>
    row.map((cell) => ({ ...cell, element: undefined }))
  ),
  // TODO: Serialize it properly
  // mines: new Set(state.mines),
  elements: undefined,
  solver: undefined,
});
