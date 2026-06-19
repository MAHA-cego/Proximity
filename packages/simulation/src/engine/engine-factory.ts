import { Engine } from "./engine";

import { MatchSystem, SystemRegistry, TurnSystem } from "../systems";

export function createEngine(): Engine {
  return new Engine(new SystemRegistry([new TurnSystem(), new MatchSystem()]));
}
