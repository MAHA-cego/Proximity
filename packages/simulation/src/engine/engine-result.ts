import type { GameEvent } from "../events";
import type { GameState } from "../state";

export interface EngineResult {
  readonly state: GameState;

  readonly events: readonly GameEvent[];
}
