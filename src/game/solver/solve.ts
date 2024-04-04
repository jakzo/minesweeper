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

export const solve = (state: State) => {
  const result: SolveResult = {};
  for (const step of solveStepByStep(state)) {
    if (step.totalDifficulty) result.difficulty = step.totalDifficulty;
  }
  return result;
};
