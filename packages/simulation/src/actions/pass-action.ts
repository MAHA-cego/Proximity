import type { GameActionBase } from "./game-action-base";
import { ActionType } from "./action-type";

export interface PassAction extends GameActionBase {
  readonly type: ActionType.Pass;
}
