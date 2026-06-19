import type { GameActionBase } from "./game-action-base";
import { ActionType } from "./action-type";

export interface ConcedeAction extends GameActionBase {
  readonly type: ActionType.Concede;
}
