import { clickCell, revealCell } from "../interactions";
import type { SolveResult, State } from "../types";
import { getCell, indexToCoord, isStarted } from "../utils";
import {
  calculateMediumDifficulty,
  getAdjacentCells,
  getPartitions,
  search,
} from "./probabilities";

export function* solveStepByStep(state: State) {
  let mediumDifficultyReveals = 0;
  const solvedPartitionSizes: number[] = [];
  const nonAdjacentRevealAdjacentSizes: number[] = [];

  main: while (!state.stopTimeMs) {
    const adjacentCells = getAdjacentCells(state);
    const isAdjacentCellFree = [...adjacentCells].some(
      (index) => !getCell(state, ...indexToCoord(state, index))?.isFlagged
    );
    if (isAdjacentCellFree) {
      yield { step: "adjacentCells", adjacentCells };
    } else if (!isStarted(state) || state.flagCount >= state.mineCount) {
      const hiddenCells: number[] = [];
      for (const [index, cell] of state.cells.entries()) {
        if (!cell.isRevealed && !cell.isFlagged) {
          hiddenCells.push(index);
        }
      }

      const index = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];
      revealCell(state, state.cells[index]!);
      yield { step: "randomCell", cell: state.cells[index]! };
      continue;
    } else {
      yield { step: "unsolvable" };
      return;
    }

    // TODO: calculateEasyDifficulty

    const knownCells = calculateMediumDifficulty(state, adjacentCells);
    for (const [index, isMine] of knownCells) {
      clickCell(state, state.cells[index]!, isMine);
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
    yield { step: "partitions", partitions };

    partitions.sort((a, b) => a.size - b.size);

    let minAdjacentMines = 0;
    for (const partition of partitions) {
      const partitionArr = [...partition];
      const { totalCount, isMineCount, minMines } = search(
        state,
        partitionArr,
        new Map()
      );
      minAdjacentMines += minMines;

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
          clickCell(state, state.cells[index]!, isMine);
        }
        solvedPartitionSizes.push(partition.size);
        yield {
          step: "calculatePartition",
          solved: knownCells,
        };
        continue main;
      }
    }

    if (minAdjacentMines + state.flagCount >= state.mineCount) {
      const nonAdjacentCells = state.cells.filter(
        (cell) =>
          !cell.isRevealed && !cell.isFlagged && !adjacentCells.has(cell.index)
      );
      if (nonAdjacentCells.length > 0) {
        for (const cell of nonAdjacentCells) {
          clickCell(state, cell, false);
        }
        nonAdjacentRevealAdjacentSizes.push(adjacentCells.size);
        yield {
          step: "revealNonAdjacentCells",
          nonAdjacentCells,
        };
        continue;
      }
    }

    yield { step: "unsolvable" };
    return;
  }

  yield {
    step: "finished",
    totalDifficulty:
      mediumDifficultyReveals ** 0.75 +
      nonAdjacentRevealAdjacentSizes
        .sort((a, b) => b - a)
        .reduce((total, size, i) => total + size * (i + 1) ** -0.4, 0) +
      solvedPartitionSizes
        .sort((a, b) => b - a)
        .reduce((total, size, i) => total + size * (i + 1) ** -0.4, 0),
  };
}

export const solve = (state: State) => {
  const result: SolveResult = {};
  for (const step of solveStepByStep(state)) {
    if (step.totalDifficulty) result.difficulty = step.totalDifficulty;
  }
  return result;
};
