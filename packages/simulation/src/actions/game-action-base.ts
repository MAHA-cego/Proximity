import type { CombatantId } from "../core";
import type { ActionType } from "./action-type";

export interface GameActionBase {
  readonly type: ActionType;
  readonly actorId: CombatantId;
}
