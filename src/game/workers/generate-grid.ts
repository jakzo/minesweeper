import { decideMinePositionsWhere, clickCell } from "../interactions";
import { solve } from "../solver/solve";
import type { State, Cell } from "../types";
import { CancelledError, cloneState, debounce } from "../utils";

const debounced = debounce(5);

export const generateGrid = async (
  state: State,
  startingCell: Cell,
  difficultyMin = 0,
  difficultyMax = Infinity
) => {
  let numGeneratedGrids = 0;
  let generatedDifficultyMin = 0;
  let generatedDifficultyMax = 0;

  const sendStatus = () =>
    self.postMessage({
      numGeneratedGrids,
      generatedDifficultyMin,
      generatedDifficultyMax,
    });

  await decideMinePositionsWhere(
    state,
    startingCell.x,
    startingCell.y,
    async () => {
      numGeneratedGrids++;
      debounced(sendStatus);

      const stateWithFirstMove = cloneState(state);
      clickCell(
        stateWithFirstMove,
        stateWithFirstMove.cells[startingCell.index],
        false
      );
      const solveResult = solve(stateWithFirstMove);
      if (solveResult.difficulty === undefined) return false;

      if (
        generatedDifficultyMax === 0 ||
        solveResult.difficulty < generatedDifficultyMin
      ) {
        generatedDifficultyMin = solveResult.difficulty;
      }
      if (solveResult.difficulty > generatedDifficultyMax) {
        generatedDifficultyMax = solveResult.difficulty;
      }

      if (
        solveResult.difficulty < difficultyMin ||
        solveResult.difficulty > difficultyMax
      ) {
        return false;
      }

      state.solveResult = solveResult;
      return true;
    }
  );

  sendStatus();
  return state;
};
