import { Engine } from "./engine";

import {
  CooldownSystem,
  MatchSystem,
  SystemRegistry,
  TurnSystem,
  UseCardSystem,
} from "../systems";

export function createEngine(): Engine {
  return new Engine(
    new SystemRegistry([
      new TurnSystem(),
      new CooldownSystem(),
      new UseCardSystem(),
      new MatchSystem(),
    ]),
  );
}
