<script lang="ts">
  import { onDestroy } from "svelte";
  import type { State } from "../game/types";

  export let state: State | undefined;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);
    const parts =
      totalMinutes >= 1
        ? hours >= 1
          ? [hours, minutes, seconds]
          : [minutes, seconds]
        : [seconds];
    return parts
      .map((n, i) => n.toString().padStart(i === 0 ? 1 : 2, "0"))
      .join(":");
  };

  let elapsedMs = 0;
  let frameRequest: number | undefined;

  const updateInterval = () => {
    cancelAnimationFrame(frameRequest!);
    if (state?.startTimeMs) {
      elapsedMs = (state.stopTimeMs ?? Date.now()) - state.startTimeMs;
      if (!state.stopTimeMs) {
        frameRequest = requestAnimationFrame(updateInterval);
      }
    } else {
      elapsedMs = 0;
    }
  };
  $: state?.startTimeMs, state?.stopTimeMs, updateInterval();

  onDestroy(() => cancelAnimationFrame(frameRequest!));
</script>

<span class="content" class:won={state?.isWon}>
  {formatTime(elapsedMs)}<span class="milliseconds" class:won={state?.isWon}>
    .{(elapsedMs % 1000).toString().padStart(3, "0")}
  </span>
</span>

<style>
  .content {
    font-family: "Courier New", Courier, monospace;
    text-align: right;
    font-weight: bold;
    line-height: 1;
  }

  .milliseconds {
    font-size: 12px;
    color: #666;
  }

  .won {
    color: #393;
  }
</style>
