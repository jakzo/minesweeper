import type { State } from "../types";
import { cloneState, neighbors } from "../utils";

type Constraint = {
  cells: number[];
  mineCount: number;
};

export const findGridWithMine = (
  state: State,
  clickedIndex: number
): State | undefined => {
  const clickedCell = state.cells[clickedIndex];
  if (!clickedCell || clickedCell.isRevealed || state.mineCount === 0) {
    return undefined;
  }

  const assignments = new Int8Array(state.cells.length);
  assignments.fill(-1);

  for (const cell of state.cells) {
    if (cell.isRevealed) assignments[cell.index] = 0;
  }
  assignments[clickedIndex] = 1;

  const constraints: Constraint[] = [];
  const constrainedCells = new Set<number>();

  for (const cell of state.cells) {
    if (!cell.isRevealed) continue;

    const cells = [...neighbors(state, cell.x, cell.y)]
      .filter((neighbor) => !neighbor.isRevealed)
      .map((neighbor) => neighbor.index);

    constraints.push({ cells, mineCount: cell.number });
    for (const index of cells) constrainedCells.add(index);
  }

  const constraintsByCell = new Map<number, Constraint[]>();
  for (const constraint of constraints) {
    for (const index of constraint.cells) {
      const cellConstraints = constraintsByCell.get(index) ?? [];
      cellConstraints.push(constraint);
      constraintsByCell.set(index, cellConstraints);
    }
  }

  const isValid = () => {
    for (const constraint of constraints) {
      let assignedMines = 0;
      let unassigned = 0;

      for (const index of constraint.cells) {
        if (assignments[index] === 1) assignedMines++;
        else if (assignments[index] === -1) unassigned++;
      }

      if (
        assignedMines > constraint.mineCount ||
        assignedMines + unassigned < constraint.mineCount
      ) {
        return false;
      }
    }
    return true;
  };

  const countAssignedMines = () => {
    let count = 0;
    for (const assignment of assignments) {
      if (assignment === 1) count++;
    }
    return count;
  };

  const chooseNextCell = () => {
    let bestIndex: number | undefined;
    let bestScore = -1;

    for (const index of constrainedCells) {
      if (assignments[index] !== -1) continue;

      const cellConstraints = constraintsByCell.get(index) ?? [];
      let score = cellConstraints.length;
      for (const constraint of cellConstraints) {
        let assignedMines = 0;
        let unassigned = 0;
        for (const constraintIndex of constraint.cells) {
          if (assignments[constraintIndex] === 1) assignedMines++;
          else if (assignments[constraintIndex] === -1) unassigned++;
        }
        const minesNeeded = constraint.mineCount - assignedMines;
        if (minesNeeded === 0 || minesNeeded === unassigned) score += 1000;
      }

      if (score > bestScore) {
        bestIndex = index;
        bestScore = score;
      }
    }

    return bestIndex;
  };

  const search = (): boolean => {
    if (!isValid()) return false;

    const assignedMines = countAssignedMines();
    let unassignedCount = 0;
    for (const assignment of assignments) {
      if (assignment === -1) unassignedCount++;
    }
    if (
      assignedMines > state.mineCount ||
      assignedMines + unassignedCount < state.mineCount
    ) {
      return false;
    }

    const index = chooseNextCell();
    if (index === undefined) {
      const minesNeeded = state.mineCount - assignedMines;
      const unconstrained = state.cells
        .map((cell) => cell.index)
        .filter((cellIndex) => assignments[cellIndex] === -1)
        .sort(
          (a, b) =>
            Number(state.cells[b].isMine) - Number(state.cells[a].isMine)
        );

      if (minesNeeded < 0 || minesNeeded > unconstrained.length) return false;
      for (const [i, cellIndex] of unconstrained.entries()) {
        assignments[cellIndex] = i < minesNeeded ? 1 : 0;
      }
      return true;
    }

    const currentValue = state.cells[index].isMine ? 1 : 0;
    for (const value of [currentValue, 1 - currentValue]) {
      assignments[index] = value;
      if (search()) return true;
    }
    assignments[index] = -1;
    return false;
  };

  if (!search()) return undefined;

  const result = cloneState(state);
  result.mines.clear();
  for (const cell of result.cells) {
    cell.isMine = assignments[cell.index] === 1;
    cell.number = 0;
    if (cell.isMine) result.mines.add(cell.index);
  }
  for (const cell of result.cells) {
    for (const neighbor of neighbors(result, cell.x, cell.y)) {
      if (neighbor.isMine) cell.number++;
    }
  }
  delete result.solveResult;

  return result;
};
