<script lang="ts">
  import type { GameOptions, SolverGameOptions, State } from "../game/types";
  import { isStarted } from "../game/utils";

  const mineCountToRatio = (count: number) =>
    +(count / (width * height)).toFixed(3);

  const mineRatioToCount = (ratio: number) =>
    Math.floor(width * height * ratio);

  let width = 10;
  let height = 10;
  let mineRatio = 0.2;
  let mineCount = mineRatioToCount(mineRatio);
  let isMineRatioSelected = true;
  export let noGuessing = true;
  export let difficultyMin = 50;
  export let difficultyMax = 100;
  export let isFindingGrid: boolean;

  const updateMineCount = () => {
    if (isMineRatioSelected) mineCount = mineRatioToCount(mineRatio);
    else mineRatio = mineCountToRatio(mineCount);
  };

  export let onStartNewGame: (opts: GameOptions) => void;
  export let state: State | undefined;

  const onFormSubmit = () =>
    onStartNewGame({
      width,
      height,
      mineCount: mineCount ?? mineRatioToCount(mineRatio ?? 0),
    });
</script>

<form on:submit|preventDefault={onFormSubmit}>
  <div class="fields">
    <div class="grid-2-columns">
      <label for="width">Width:</label>
      <input
        id="width"
        type="number"
        min={1}
        bind:value={width}
        on:change={updateMineCount}
      />
      <label for="height">Height:</label>
      <input
        id="height"
        type="number"
        min={1}
        bind:value={height}
        on:change={updateMineCount}
      />
    </div>
    <div class="grid-3-columns">
      <input
        type="radio"
        name="mine-type"
        checked={isMineRatioSelected}
        on:click={() => (isMineRatioSelected = true)}
      />
      <label for="mine-ratio">Mine ratio:</label>
      <input
        id="mine-ratio"
        type="number"
        disabled={!isMineRatioSelected}
        min={0}
        max={1}
        step={0.01}
        bind:value={mineRatio}
        on:change={updateMineCount}
      />
      <input
        type="radio"
        name="mine-type"
        checked={!isMineRatioSelected}
        on:click={() => (isMineRatioSelected = false)}
      />
      <label for="mine-count">Mine count:</label>
      <input
        id="mine-count"
        type="number"
        disabled={isMineRatioSelected}
        min={0}
        max={width * height}
        bind:value={mineCount}
        on:change={updateMineCount}
      />
    </div>
  </div>
  <div class="submit-button">
    <button type="submit">Start new game</button>
  </div>
  {#if state}
    <div class="fields">
      <div class="grid-2-columns">
        <label for="no-guessing">No guessing:</label>
        <div>
          <input
            id="no-guessing"
            type="checkbox"
            disabled={isFindingGrid || isStarted(state)}
            bind:checked={noGuessing}
          />
        </div>
      </div>
      <div class="grid-2-columns">
        <label for="difficulty-min">Difficulty min:</label>
        <input
          id="difficulty-min"
          type="number"
          min={0}
          max={difficultyMax}
          step="any"
          disabled={isFindingGrid || !noGuessing || isStarted(state)}
          bind:value={difficultyMin}
        />
        <label for="difficulty-max">Difficulty max:</label>
        <input
          id="difficulty-max"
          type="number"
          min={difficultyMin}
          step="any"
          disabled={isFindingGrid || !noGuessing || isStarted(state)}
          bind:value={difficultyMax}
        />
      </div>
    </div>
  {/if}
</form>

<style>
  .fields {
    display: flex;
    gap: 32px;
    margin-bottom: 8px;
  }

  .fields > div {
    display: grid;
    gap: 8px;
  }

  label {
    white-space: nowrap;
  }

  .grid-2-columns {
    flex-grow: 1;
    grid-template-columns: auto 1fr;
  }

  .grid-3-columns {
    flex-grow: 1.2;
    grid-template-columns: auto auto 1fr;
  }

  input[type="number"] {
    min-width: 60px;
  }

  .submit-button {
    display: flex;
    justify-content: center;
    margin: 8px 0;
  }
</style>
