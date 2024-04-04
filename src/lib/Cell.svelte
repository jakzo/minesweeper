<script lang="ts">
  import type { Cell, SolverStep } from "../game/types";

  const isMouseButtonFlag = (evt: MouseEvent) => [false, , true][evt.button];

  export let cell: Cell;
  export let isFinished: boolean;
  export let isWon: boolean;
  export let isStartingCell: boolean;
  export let isDisabled: boolean;
  export let probability: number | undefined = undefined;
  export let solverStep: SolverStep | undefined | void;
  export let onClick: (isFlag: boolean) => void;

  let isSelected = false;

  const onMouseDown = (evt: MouseEvent) => {
    if (isDisabled) return;

    const isFlag = isMouseButtonFlag(evt);
    if (isFlag === undefined || isFinished || cell.isRevealed) return;

    if (isFlag) {
      onClick(true);
      return;
    }

    element.addEventListener("mouseleave", cancelMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    isSelected = true;
  };

  const cancelMouseDown = () => {
    element.removeEventListener("mouseleave", cancelMouseDown);
    document.removeEventListener("mouseup", onMouseUp);
    isSelected = false;
  };

  const onMouseUp = (evt: MouseEvent) => {
    const isFlag = isMouseButtonFlag(evt);
    if (isFlag !== false) return;
    cancelMouseDown();
    onClick(false);
  };

  let element: HTMLButtonElement;

  let partitionIndex: number | undefined;
  $: {
    const idx = solverStep?.partitions?.findIndex((partition) =>
      partition.has(cell.index)
    );
    partitionIndex = idx !== -1 ? idx : undefined;
  }
</script>

<button
  class:revealed={cell.isRevealed}
  class:hidden={!cell.isRevealed}
  class:mine={cell.isMine}
  class:flag={cell.isFlagged}
  class:selected={isSelected}
  class:finished={isFinished}
  class:won={isWon}
  class:start={isStartingCell}
  class:solver-adjacent={solverStep?.adjacentCells?.has(cell.index)}
  class:solver-solved={solverStep?.solved?.has(cell.index)}
  class={partitionIndex !== undefined
    ? `solver-partition${partitionIndex}`
    : ""}
  disabled={isDisabled}
  on:mousedown={onMouseDown}
  on:contextmenu|preventDefault
  bind:this={element}
>
  {cell.isRevealed || isFinished
    ? cell.isMine
      ? "💣"
      : cell.number || ""
    : cell.isFlagged
      ? "🚩"
      : ""}
  {#if probability !== undefined}
    <div
      class="probability"
      class:yes={probability === 1}
      class:no={probability === 0}
      class:maybe={probability !== 0 && probability !== 1}
    >
      {Math.round(probability * 100)}%
    </div>
  {/if}
</button>

<style>
  button {
    border-radius: 0;
    padding: 0;
    border: 1px solid #666;
    width: 32px;
    height: 32px;
    display: inline-block;
    text-align: center;
    line-height: 32px;
    font-size: 24px;
    overflow: hidden;
    background: #fff;
    cursor: pointer;
    color: #000;
    box-sizing: border-box;
    position: relative;
  }

  button.start {
    background: #9b9;
  }

  button:disabled {
    filter: brightness(0.5) saturate(0.5);
  }

  .hidden {
    background: #999;
  }
  .hidden:hover:not(:disabled) {
    background: #ccc;
  }
  .hidden::before {
    content: "";
  }
  .hidden.finished {
    background: #ccc;
  }

  .hidden.selected {
    background: #eee;
    border: 2px solid #111;
  }

  .finished.hidden.mine.flag {
    background: #393;
  }
  .finished.hidden.flag,
  .mine.revealed {
    background: #f99;
  }

  .probability {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    font-size: 9px;
    pointer-events: none;
  }

  .probability.yes {
    border: 2px solid #c33;
  }
  .probability.no {
    border: 2px solid #3c3;
  }
  .probability.maybe {
    border: 2px solid #cc3;
  }

  .solver-adjacent {
    border: 2px solid #33c;
  }
  .solver-solved {
    border: 2px solid #3c9;
  }
  .solver-partition0 {
    border: 2px solid #c3c;
  }
  .solver-partition1 {
    border: 2px solid #3cc;
  }
  .solver-partition2 {
    border: 2px solid #cc3;
  }
</style>
