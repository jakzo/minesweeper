<script lang="ts">
  import type { solveStepByStep } from "../game/solver/solve";
  import type { State } from "../game/types";
  import { isFinished, isStarted } from "../game/utils";

  export let state: State | undefined;
  export let undo: () => void;
  export let stepThroughSolve: () => void;
  export let showProbabilitiesOnMove = false;
  export let showProbabilities: () => void;
  export let hideProbabilities: () => void;
  export let solverStep: ReturnType<
    ReturnType<typeof solveStepByStep>["next"]
  >["value"];

  let isOpen = true;

  let isGameInProgress: boolean;
  $: isGameInProgress = state ? !isFinished(state) && isStarted(state) : false;
</script>

<form on:submit|preventDefault>
  {#if isOpen}
    <div class="fields">
      <button on:click={() => (isOpen = false)}>Hide debug menu</button>
      <button disabled={!state || state.moves.length <= 1} on:click={undo}>
        Undo
      </button>
      <div>
        <button disabled={!isGameInProgress} on:click={stepThroughSolve}>
          Step through solve
        </button>
        {#if solverStep}
          Last step: {solverStep?.step}
        {/if}
      </div>
    </div>
    <div class="fields">
      Probabilities:
      <div>
        <label for="show-probabilities-on-move">Show on move:</label>
        <input
          id="show-probabilities-on-move"
          type="checkbox"
          disabled={state ? isFinished(state) : false}
          bind:checked={showProbabilitiesOnMove}
        />
      </div>
      <button disabled={!isGameInProgress} on:click={showProbabilities}>
        Show
      </button>
      <button disabled={!isGameInProgress} on:click={hideProbabilities}>
        Hide
      </button>
    </div>
  {:else}
    <button on:click={() => (isOpen = true)}>Show debug menu</button>
  {/if}
</form>

<style>
  .fields {
    display: flex;
    gap: 32px;
    margin-bottom: 8px;
  }

  label {
    white-space: nowrap;
  }
</style>
