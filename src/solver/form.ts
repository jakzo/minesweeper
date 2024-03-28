import { State } from "../types";
import { createCheckbox, getCell } from "../utils";
import { workerClient } from "../workers/utils";
import { calculateProbabilities } from "./probabilities";
import { clearProbabilities, solve } from "./solve";

export interface Probability {
  x: number;
  y: number;
  mineChance: number;
}

let solver: ReturnType<typeof solve> | undefined;

export const resetSolver = () => {
  solver = undefined;
};

export const initSolverForm = (state: State) => {
  resetSolver();

  const form = document.createElement("form");
  form.addEventListener("submit", (evt) => evt.preventDefault());

  const showProbabilitiesButton = createButton(
    form,
    "Show probabilities",
    async () => {
      showProbabilitiesButton.disabled = true;
      const probabilities = await workerClient.calculateProbabilities(state);
      showProbabilitiesButton.disabled = false;
      showProbabilities(state, probabilities);
    }
  );

  createButton(form, "Hide probabilities", () => clearProbabilities(state));

  createButton(form, "Step through solve", () => {
    if (!solver) solver = solve(state);
    const result = solver.next();
    if (result.done) return;
    solveStepEl.textContent = `Last solve step: ${result.value.step}`;
    if (result.value.totalDifficulty)
      solveStepEl.textContent += ` (difficulty = ${result.value.totalDifficulty})`;
  });

  const minDifficultyEl = createTextInput(
    form,
    "Minimum difficulty: ",
    "number",
    "50"
  );

  state.solver = {
    elements: {
      showProbabilities: showProbabilitiesButton,
      minDifficulty: minDifficultyEl,
      probabilitiesEveryMove: createCheckbox(
        form,
        "Show probabilities on every move: ",
        false
      ),
      guessesAlwaysSucceed: createCheckbox(
        form,
        "Guesses always succeed: ",
        false,
        true
      ),
      ensureSolvable: createCheckbox(form, "Ensure solvable: ", true),
    },
  };

  const solveStepEl = document.createElement("div");
  form.append(solveStepEl);

  state.elements?.forms.append(form);
};

const createButton = (
  parent: HTMLElement,
  text: string,
  onClick: () => void
) => {
  const buttonEl = document.createElement("button");
  buttonEl.textContent = text;
  buttonEl.addEventListener("click", onClick);
  parent.append(buttonEl);
  return buttonEl;
};

const createTextInput = (
  parent: HTMLElement,
  label: string,
  type: string,
  defaultValue = ""
) => {
  const containerEl = document.createElement("div");
  containerEl.classList.add("container");
  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  const inputEl = document.createElement("input");
  inputEl.type = type;
  inputEl.value = defaultValue;
  const id = label
    .replace(/^\W+|\W+$/g, "")
    .replace(/\W+/g, "-")
    .toLowerCase();
  labelEl.htmlFor = inputEl.id = id;
  containerEl.append(labelEl, inputEl);
  parent.append(containerEl);
  return inputEl;
};

export const onBeforeMove = async (state: State, x: number, y: number) => {
  if (!state.solver?.elements?.guessesAlwaysSucceed.checked) return;

  const cell = getCell(state, x, y)!;
  if (!cell.isMine) return;

  const probabilities = calculateProbabilities(state);
  const probability = probabilities.find((p) => p.x === x && p.y === y);
  if (probability) {
    if (probability.mineChance !== 1) {
      cell.isMine = false;
      // TODO
    }
  } else {
    // TODO
  }
};

export const onAfterMove = (state: State) => {
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
    cell.element?.classList.add(
      mineChance === 0 ? "green" : mineChance === 1 ? "red" : "yellow"
    );

    const overlay = document.createElement("div");
    overlay.classList.add("probability");
    overlay.textContent = `${Math.round(mineChance * 100)}%`;
    cell.element?.append(overlay);
  }
};
