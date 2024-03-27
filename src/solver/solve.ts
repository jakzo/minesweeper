import { flagCell, revealCell } from "../game/controls";
import { State } from "../types";
import { cloneState, coordToIndex, getCell, indexToCoord } from "../utils";
import {
  calculateMediumDifficulty,
  getAdjacentCells,
  getPartitions,
  search,
} from "./probabilities";

export function* solve(state: State) {
  let mediumDifficultyReveals = 0;
  const solvedPartitionSizes: number[] = [];

  main: while (!state.isFinished) {
    const adjacentCells = getAdjacentCells(state);
    const isAdjacentCellFree = [...adjacentCells].some(
      (index) => !getCell(state, ...indexToCoord(state, index))?.isFlagged
    );
    if (isAdjacentCellFree) {
      clearProbabilities(state);
      for (const index of adjacentCells) {
        getCell(state, ...indexToCoord(state, index))?.element?.classList.add(
          "highlight",
          "blue"
        );
      }
      yield { step: "adjacentCells", adjacentCells };
    } else {
      const hiddenCells: number[] = [];
      for (const [y, row] of state.grid.entries()) {
        for (const [x, cell] of row.entries()) {
          if (!cell.isRevealed && !cell.isFlagged) {
            hiddenCells.push(coordToIndex(state, x, y));
          }
        }
      }

      const index = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
      const [x, y] = indexToCoord(state, index);
      revealCell(state, x, y);
      yield { step: "randomCell", x, y };
      continue;
    }

    // TODO: calculateEasyDifficulty

    const knownCells = calculateMediumDifficulty(state, adjacentCells);
    for (const [index, isMine] of knownCells) {
      (isMine ? flagCell : revealCell)(state, ...indexToCoord(state, index));
    }
    for (const [, isMine] of knownCells) {
      if (!isMine) mediumDifficultyReveals++;
    }
    yield {
      step: "calculateMediumDifficulty",
      solved: knownCells,
    };

    if (knownCells.size > 0) continue;

    const partitions = getPartitions(state, adjacentCells, knownCells);
    clearProbabilities(state);
    for (const [i, partition] of partitions.entries()) {
      for (const index of partition) {
        getCell(state, ...indexToCoord(state, index))?.element?.classList.add(
          "highlight",
          `partition${i % 3}`
        );
      }
    }
    yield { step: "partitions", partitions };

    partitions.sort((a, b) => a.size - b.size);

    for (const partition of partitions) {
      const partitionArr = [...partition];
      const { totalCount, isMineCount } = search(
        state,
        partitionArr,
        new Map()
      );

      const knownCells = new Map(
        isMineCount
          .map((count, i) =>
            count === totalCount
              ? [partitionArr[i], true]
              : count === 0
              ? [partitionArr[i], false]
              : undefined
          )
          .filter((x): x is [number, boolean] => x !== undefined)
      );

      if (knownCells.size > 0) {
        for (const [index, isMine] of knownCells) {
          // TODO: Change func signature since I always call them like this
          (isMine ? flagCell : revealCell)(
            state,
            ...indexToCoord(state, index)
          );
        }
        solvedPartitionSizes.push(partition.size);
        yield {
          step: "calculatePartition",
          solved: knownCells,
        };
        continue main;
      }
    }

    // TODO: If all mines are accounted for in adjacent cells, reveal all
    // non-adjacent cells

    yield { step: "unsolvable" };
    return;
  }

  yield {
    step: "finished",
    totalDifficulty:
      mediumDifficultyReveals ** 0.75 +
      solvedPartitionSizes
        .sort((a, b) => b - a)
        .reduce((total, size, i) => total + size * (i + 1) ** -0.4, 0),
  };
}

export const getDifficulty = (state: State) => {
  const clonedState = cloneState(state);
  for (const result of solve(clonedState)) {
    if (result.totalDifficulty) return result.totalDifficulty;
  }
  return undefined;
};

export const clearProbabilities = (state: State) => {
  for (const row of state.grid) {
    for (const cell of row) {
      if (!cell.element) continue;
      cell.element.classList.remove(
        "highlight",
        "red",
        "green",
        "yellow",
        ...[0, 1, 2].map((i) => `partition${i}`)
      );
      for (const child of cell.element.children) {
        if (child.classList.contains("probability")) child.remove();
      }
    }
  }
};
