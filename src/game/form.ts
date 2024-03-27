import { State } from "../types";
import { startGame } from "./game";

export const initGameForm = (state: State) => {
  const form = document.createElement("form");

  const widthEl = createTextInput(
    form,
    "Width: ",
    "number",
    state.width.toString()
  );
  const heightEl = createTextInput(
    form,
    "Height: ",
    "number",
    state.height.toString()
  );
  const mineCountEl = createTextInput(
    form,
    "Mine count: ",
    "number",
    state.mineCount.toString()
  );

  const submitEl = document.createElement("button");
  submitEl.type = "submit";
  submitEl.textContent = "Start new game";
  form.append(submitEl);

  form.addEventListener("submit", (evt) => {
    evt.preventDefault();
    if (!state.elements) return;

    for (const el of Object.values(state.elements)) {
      if (el !== state.elements.parent) el.remove();
    }

    startGame(
      +widthEl.value,
      +heightEl.value,
      +mineCountEl.value,
      state.elements?.parent,
      state.showSolverForm
    );
  });

  state.elements?.forms.append(form);
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
