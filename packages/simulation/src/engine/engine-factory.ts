import { Engine } from "./engine";

import {
  MatchSystem,
  SystemRegistry,
  TurnSystem,
  UseCardSystem,
} from "../systems";

export function createEngine(): Engine {
  return new Engine(
    new SystemRegistry([
      new TurnSystem(),
      new MatchSystem(),
      new UseCardSystem(),
    ]),
  );
}
