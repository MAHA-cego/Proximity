import { Engine } from "./engine";

import {
  CooldownSystem,
  MatchSystem,
  StatusSystem,
  SystemRegistry,
  TurnSystem,
  UseCardSystem,
} from "../systems";

export function createEngine(): Engine {
  return new Engine(
    new SystemRegistry([
      new TurnSystem(),
      new StatusSystem(),
      new CooldownSystem(),
      new UseCardSystem(),
      new MatchSystem(),
    ]),
  );
}
