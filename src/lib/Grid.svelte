<script lang="ts">
  import type { solveStepByStep } from "../game/solver/solve";
  import type { Cell, Probabilities, SolverStep, State } from "../game/types";
  import CellComponent from "./Cell.svelte";

  export let state: State;
  export let isFindingGrid: boolean;
  export let probabilities: Probabilities | undefined;
  export let solverStep: SolverStep | undefined | void;
  export let onClick: (cell: Cell, isFlag: boolean) => void;

  function* rowIndexes(state: State) {
    for (let i = 0; i < state.height; i++) {
      yield i;
    }
  }

  function* cellsInRow(state: State, rowIndex: number) {
    for (let i = 0; i < state.width; i++) {
      yield state.cells[rowIndex * state.width + i];
    }
  }
</script>

<div class="grid">
  {#each rowIndexes(state) as rowIdx (rowIdx)}
    <div class="row">
      {#each cellsInRow(state, rowIdx) as cell (cell.index)}
        <CellComponent
          {cell}
          isFinished={!!state.stopTimeMs}
          isWon={state.isWon}
          onClick={(isFlag) => onClick(cell, isFlag)}
          isStartingCell={state.startingCell === cell.index}
          isDisabled={isFindingGrid}
          probability={probabilities?.get(cell.index)}
          {solverStep}
        />
      {/each}
    </div>
  {/each}
</div>

<style>
  .grid {
    line-height: 8px;
    user-select: none;
    padding: 16px 0;
  }

  .row {
    white-space: nowrap;
    display: flex;
    justify-content: center;
  }
</style>
