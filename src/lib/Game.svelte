<script lang="ts">
  import { onMount } from "svelte";

  import {
    initWorkers,
    destroyWorkers,
    workerClient,
  } from "../game/workers/utils";
  import NewGameForm from "./NewGameForm.svelte";
  import Grid from "./Grid.svelte";
  import type {
    Cell,
    GameOptions,
    Probabilities,
    SolverStep,
    State,
  } from "../game/types";
  import {
    CancelledError,
    initState,
    isFinished,
    isStarted,
    undo,
  } from "../game/utils";
  import TimerDisplay from "./TimerDisplay.svelte";
  import { clickCell, decideMinePositionsRandom } from "../game/interactions";
  import { solveStepByStep } from "../game/solver/solve";
  import DebugForm from "./DebugForm.svelte";

  export let showDebugMenu = false;

  let gameOptions: GameOptions | undefined;
  let state: State | undefined;
  let solver: ReturnType<typeof solveStepByStep> | undefined;
  let solverStep: SolverStep | undefined | void;
  let numGeneratedGrids = 0;
  // TODO: Shade clicked cell yellow when probability not 0% or 100%
  let noGuessing = true;
  let difficultyMin = 50;
  let difficultyMax = 100;

  let generatedDifficultyMin = 0;
  let generatedDifficultyMax = 0;
  let generateGridPromise:
    | ReturnType<typeof workerClient.generateGrid>
    | undefined;
  let generatingState: State | undefined;

  const clearGeneratingState = () => {
    generatedDifficultyMin = 0;
    generatedDifficultyMax = 0;
    generateGridPromise = generatingState = undefined;
  };

  let probabilities: Probabilities | undefined;
  let showProbabilitiesOnMove = false;

  let isCalculatingProbabilities = false;
  let recalculateProbabilities = false;
  const showProbabilities = async (state: State) => {
    if (isCalculatingProbabilities) {
      recalculateProbabilities = true;
      return;
    }

    isCalculatingProbabilities = true;
    probabilities = await workerClient.calculateProbabilities(state);
    isCalculatingProbabilities = false;

    if (recalculateProbabilities) {
      recalculateProbabilities = false;
      showProbabilities(state);
    }
  };

  $: if (state && isFinished(state)) probabilities = undefined;
  $: if (showProbabilitiesOnMove && state) showProbabilities(state);

  const onCellClick = async (cell: Cell, isFlag: boolean) => {
    if (!state || !gameOptions) return;

    try {
      const isFirstMove = !isStarted(state);
      if (isFirstMove) {
        state.startingCell = cell.index;
        if (noGuessing) {
          numGeneratedGrids = 0;
          generatingState = state;

          generateGridPromise = workerClient.generateGrid(
            state,
            cell,
            noGuessing ? difficultyMin : undefined,
            noGuessing ? difficultyMax : undefined
          );

          generateGridPromise.onMessage = (evt) => {
            if (!evt.data?.numGeneratedGrids) return;
            numGeneratedGrids = evt.data.numGeneratedGrids;
            generatedDifficultyMin = evt.data.generatedDifficultyMin;
            generatedDifficultyMax = evt.data.generatedDifficultyMax;
          };

          const result = await generateGridPromise;
          clearGeneratingState();
          state = result;
        } else {
          decideMinePositionsRandom(state, cell.x, cell.y);
        }
      }
      clickCell(state, cell, isFlag);
      if (isFirstMove && !state.solveResult) {
        state.solveResult = await workerClient.solve(state);
      }

      triggerStateUpdate();
    } catch (err) {
      if (!(err instanceof CancelledError)) throw err;
    }
  };

  const triggerStateUpdate = () => {
    if (!state) return;
    if (showProbabilitiesOnMove) showProbabilities(state);
    solver = solverStep = undefined;
    state = state;
  };

  onMount(() => {
    initWorkers();
    return destroyWorkers;
  });
</script>

<div class="form-container">
  <NewGameForm
    onStartNewGame={(opts) => {
      gameOptions = opts;
      state = initState(opts);
      solver = solverStep = probabilities = undefined;
      generateGridPromise?.cancel();
      clearGeneratingState();
      numGeneratedGrids = 0;
    }}
    {state}
    isFindingGrid={!!generateGridPromise}
    bind:noGuessing
    bind:difficultyMin
    bind:difficultyMax
  />
  {#if state}
    <div class="game-info">
      <div>
        {#if state.solveResult}
          <div>
            Difficulty: {state.solveResult.difficulty !== undefined
              ? state.solveResult.difficulty.toFixed(1)
              : "unsolvable"}
          </div>
          <div>(generated grids: {numGeneratedGrids})</div>
        {:else}
          <div>Generated grids: {numGeneratedGrids}</div>
          <div>
            (difficulties found = {generatedDifficultyMin.toFixed(1)} - {generatedDifficultyMax.toFixed(
              1
            )})
          </div>
        {/if}
      </div>
      <div>
        Mines remaining: {state.mineCount - state.flagCount}
      </div>
      <div>
        <div>Time: <TimerDisplay {state} /></div>
        {#if state.stopTimeMs}
          {#if state.isWon}
            <div class="won">You win!</div>
          {:else}
            <div class="lost">Game over</div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>
{#if state}
  <Grid
    {state}
    isFindingGrid={!!generateGridPromise}
    {probabilities}
    {solverStep}
    onClick={onCellClick}
  />
  {#if showDebugMenu}
    <div class="form-container">
      <DebugForm
        {state}
        undo={() => {
          if (!state) return;
          undo(state);
          triggerStateUpdate();
        }}
        stepThroughSolve={() => {
          if (!state) return;
          if (!solver) solver = solveStepByStep(state);
          solverStep = solver.next().value;
          state = state;
        }}
        {solverStep}
        bind:showProbabilitiesOnMove
        showProbabilities={() => state && showProbabilities(state)}
        hideProbabilities={() => {
          probabilities = undefined;
        }}
      />
    </div>
  {/if}
{/if}

<style>
  .form-container {
    max-width: 720px;
    margin: 0 auto;
  }

  .game-info {
    display: flex;
    flex-direction: row;
    text-align: center;
  }

  .game-info > * {
    flex: 1;
  }

  .won {
    color: #393;
    font-weight: bold;
  }

  .lost {
    color: #933;
    font-weight: bold;
  }
</style>
