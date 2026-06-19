import type { GameActionBase } from "./game-action-base";
import { ActionType } from "./action-type";

export interface EndTurnAction extends GameActionBase {
  readonly type: ActionType.EndTurn;
}
