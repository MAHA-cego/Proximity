import type { ConcedeAction } from "./concede-action";
import type { EndTurnAction } from "./end-turn-action";
import type { PassAction } from "./pass-action";
import type { UseCardAction } from "./use-card-action";

export type GameAction =
  | EndTurnAction
  | PassAction
  | ConcedeAction
  | UseCardAction;
