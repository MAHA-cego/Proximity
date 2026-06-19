import type { CardInstanceId } from "../core";

import type { GameActionBase } from "./game-action-base";
import { ActionType } from "./action-type";

export interface UseCardAction extends GameActionBase {
  readonly type: ActionType.UseCard;

  readonly cardInstanceId: CardInstanceId;
}
