import "./style.css";
import { startGame } from "./game/game.ts";
import { initWorkers } from "./workers/utils.ts";

const WIDTH = 40;
const HEIGHT = 24;
const MINE_RATIO = 0.2;

startGame(
  WIDTH,
  HEIGHT,
  Math.floor(WIDTH * HEIGHT * MINE_RATIO),
  document.querySelector<HTMLDivElement>("#app")!,
  true
);

initWorkers();
