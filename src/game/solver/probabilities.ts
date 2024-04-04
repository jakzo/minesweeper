import type { Probabilities, State } from "../types";
import { coordToIndex, getCell, indexToCoord, neighbors } from "../utils";

// TODO: Ignore flags
export const calculateProbabilities = (state: State): Probabilities => {
  console.time("calculateProbabilities");

  const adjacentCells = getAdjacentCells(state);

  const knownCells = calculateMediumDifficulty(state, adjacentCells);

  // Simple algorithm is to DFS every combination of mine/not-mine on
  // unrevealed cells adjacent to revealed cells but that gets exponentially
  // slow based on number of cells so we first partition them into smaller
  // segments where the DFS results will not affect other cells
  const partitions = getPartitions(state, adjacentCells, knownCells);

  const probabilities = partitions
    .flatMap((partition) => {
      const partitionArr = [...partition];
      const { totalCount, isMineCount } = search(
        state,
        partitionArr,
        knownCells
      );

      const probabilities = [...partitionArr.entries()].map(
        ([i, index]): [number, number] => {
          const mineChance = isMineCount[i] / totalCount;
          return [index, mineChance];
        }
      );

      return probabilities;
    })
    .concat(
      [...knownCells].map(([index, isMine]) => {
        const [x, y] = indexToCoord(state, index);
        return [index, isMine ? 1 : 0];
      })
    );

  console.timeEnd("calculateProbabilities");

  return new Map(probabilities);
};

export const getAdjacentCells = (state: State) => {
  const adjacentCells = new Set<number>();
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const cell = getCell(state, x, y)!;
      if (
        !cell.isRevealed &&
        !cell.isFlagged &&
        isAdjacentToRevealedCell(state, x, y)
      ) {
        const index = coordToIndex(state, x, y);
        adjacentCells.add(index);
      }
    }
  }
  return adjacentCells;
};

export const calculateMediumDifficulty = (
  state: State,
  adjacentCells: Set<number>
) => {
  const knownCells = new Map<number, boolean>();
  for (const index of adjacentCells) {
    const nearbyAdjacentCells = new Set<number>([index]);
    const [x, y] = indexToCoord(state, index);
    for (const cell1 of neighbors(state, x, y)) {
      if (!cell1.isRevealed) continue;
      for (const cell2 of neighbors(state, cell1.x, cell1.y)) {
        if (!adjacentCells.has(cell2.index)) continue;
        nearbyAdjacentCells.add(cell2.index);
      }
    }

    const { totalCount, isMineCount } = search(
      state,
      [...nearbyAdjacentCells],
      knownCells
    );
    const count = isMineCount[0];
    if (count === 0 || count >= totalCount)
      knownCells.set(index, count >= totalCount);
  }
  return knownCells;
};

// TODO: Get partitions via BFS since some boundaries touch
export const getPartitions = (
  state: State,
  adjacentCells: Set<number>,
  knownCells: Map<number, boolean>
) => {
  const visited = new Set<number>();
  const partitions: Set<number>[] = [];

  for (const index of adjacentCells) {
    const partition = new Set<number>();
    const visit = (index: number) => {
      if (
        visited.has(index) ||
        knownCells.has(index) ||
        !adjacentCells.has(index) ||
        partition.has(index)
      )
        return;

      visited.add(index);
      partition.add(index);

      for (const cell1 of neighbors(state, ...indexToCoord(state, index))) {
        if (cell1.isRevealed) {
          for (const cell2 of neighbors(state, cell1.x, cell1.y)) {
            visit(cell2.index);
          }
        }
      }
    };

    visit(index);

    if (partition.size > 0) partitions.push(partition);
  }

  return partitions;
};

export const search = (
  state: State,
  adjacentCells: number[],
  knownCells: Map<number, boolean>
) => {
  const isMineCount = adjacentCells.map(() => 0);
  let totalCount = 0;

  const visited = new Map<number, number>();
  const mineStack: boolean[] = [];
  let minesLeft = state.mineCount - state.flagCount;

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
          const isKnownMine = knownCells.get(n2.index);
          if (isKnownMine !== undefined) {
            if (isKnownMine) neighboringFlags++;
            continue;
          }
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

  return { totalCount, isMineCount };
};

const isAdjacentToRevealedCell = (state: State, x: number, y: number) => {
  for (const neighbor of neighbors(state, x, y)) {
    if (neighbor?.isRevealed) return true;
  }
  return false;
};
