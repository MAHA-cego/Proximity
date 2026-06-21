import type {
  GameAction,
  GameState,
  MatchDefinition,
} from "@proximity/simulation";

export interface AiAgent {
  selectAction(state: GameState, definition: MatchDefinition): GameAction;
}
