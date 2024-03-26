import { State } from "../types";
import { coordToIndex, getCell, indexToCoord, neighbors } from "../utils";

export interface Probability {
  x: number;
  y: number;
  mineChance: number;
}

export const calculateProbabilities = (state: State): Probability[] => {
  const adjacentCells: number[] = [];
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const cell = getCell(state, x, y)!;
      if (
        !cell.isRevealed &&
        !cell.isFlagged &&
        isAdjacentToRevealedCell(state, x, y)
      ) {
        const index = coordToIndex(state, x, y);
        adjacentCells.push(index);
      }
    }
  }

  const isMineCount = adjacentCells.map(() => 0);
  let totalCount = 0;

  const visited = new Map<number, number>();
  const mineStack: boolean[] = [];
  let minesLeft = state.mineCount - state.flagCount;

  // TODO: partition adjacent cells and calculate separately for speed
  const visit = () => {
    if (mineStack.length >= adjacentCells.length) {
      totalCount++;
      for (const [i, isMine] of mineStack.entries()) {
        if (isMine) isMineCount[i]++;
      }
      return;
    }

    const index = adjacentCells[mineStack.length];
    visited.set(index, mineStack.length);

    const possibilities = minesLeft <= 0 ? [false] : [false, true];
    for (const isMine of possibilities) {
      mineStack.push(isMine);
      if (isMine) minesLeft--;

      const [x, y] = indexToCoord(state, index);
      const revealedNeighbors = new Set<number>();
      for (const cell of neighbors(state, x, y)) {
        if (cell.isRevealed) revealedNeighbors.add(cell.index);
      }

      const isChoiceValid = [...revealedNeighbors].every((ci) => {
        const [cx, cy] = indexToCoord(state, ci);
        let neighboringFlags = 0;
        for (const n2 of neighbors(state, cx, cy)) {
          if (n2.isRevealed) continue;
          if (n2.isFlagged) {
            neighboringFlags++;
            continue;
          }
          const stackIdx = visited.get(n2.index);
          if (stackIdx === undefined) return true;
          if (mineStack[stackIdx]) neighboringFlags++;
        }
        return neighboringFlags === getCell(state, cx, cy)!.number;
      });

      if (isChoiceValid) visit();

      if (isMine) minesLeft++;
      mineStack.pop();
    }

    visited.delete(index);
  };

  visit();

  return [...adjacentCells.entries()].map(([i, index]) => {
    const [x, y] = indexToCoord(state, index);
    const mineChance = isMineCount[i] / totalCount;
    return { x, y, mineChance };
  });
};

const isAdjacentToRevealedCell = (state: State, x: number, y: number) => {
  for (const neighbor of neighbors(state, x, y)) {
    if (neighbor?.isRevealed) return true;
  }
  return false;
};
