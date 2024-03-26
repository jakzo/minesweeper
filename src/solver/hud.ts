import { State } from "../types";
import { getCell } from "../utils";
import { workerClient } from "../workers/utils";
import { calculateProbabilities } from "./probabilities";

export interface Probability {
  x: number;
  y: number;
  mineChance: number;
}

export const initHud = (state: State) => {
  const container = document.createElement("div");

  const showProbabilitiesButton = document.createElement("button");
  showProbabilitiesButton.textContent = "Show probabilities";
  showProbabilitiesButton.addEventListener("click", async () => {
    showProbabilitiesButton.disabled = true;
    const probabilities = await workerClient.calculateProbabilities(state);
    showProbabilitiesButton.disabled = false;
    showProbabilities(state, probabilities);
  });
  container.append(showProbabilitiesButton);

  const label = document.createElement("label");
  label.textContent = "Show probabilities on every move: ";
  const probabilitiesEveryMove = document.createElement("input");
  probabilitiesEveryMove.type = "checkbox";
  label.htmlFor = probabilitiesEveryMove.id = "show-probabilities-every-move";
  container.append(" ", label, probabilitiesEveryMove);

  state.elements?.hud.append(container);

  state.solver = {
    elements: {
      showProbabilities: showProbabilitiesButton,
      probabilitiesEveryMove,
    },
  };
};

export const onMove = (state: State) => {
  if (state.solver?.elements?.probabilitiesEveryMove.checked) {
    calculateAndShowProbabilities(state);
  }
};

let isCalculatingProbabilities = false;
let recalculateProbabilities = false;
export const calculateAndShowProbabilities = async (state: State) => {
  if (isCalculatingProbabilities) {
    recalculateProbabilities = true;
    return;
  }

  isCalculatingProbabilities = true;
  const result = await workerClient.calculateProbabilities(state);
  showProbabilities(state, result);
  isCalculatingProbabilities = false;

  if (recalculateProbabilities) {
    recalculateProbabilities = false;
    calculateAndShowProbabilities(state);
  }
};

export const showProbabilities = (
  state: State,
  probabilities = calculateProbabilities(state)
) => {
  clearProbabilities(state);

  for (const { x, y, mineChance } of probabilities) {
    const cell = getCell(state, x, y)!;
    cell.element?.classList.add("highlight");

    const overlay = document.createElement("div");
    overlay.classList.add("probability");
    overlay.textContent = `${Math.round(mineChance * 100)}%`;
    cell.element?.append(overlay);
  }
};

export const clearProbabilities = (state: State) => {
  for (const row of state.grid) {
    for (const cell of row) {
      if (!cell.element) continue;
      cell.element.classList.remove("highlight");
      for (const child of cell.element.children) {
        if (child.classList.contains("probability")) child.remove();
      }
    }
  }
};
