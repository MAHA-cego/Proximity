import { Engine } from "./engine";

import { SystemRegistry } from "../systems";

import { TurnSystem } from "../systems";

export function createEngine(): Engine {
  return new Engine(new SystemRegistry([new TurnSystem()]));
}
