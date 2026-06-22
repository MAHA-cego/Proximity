import type { CombatantId, StatusType } from "../core";
import { EventType } from "./event-type";
import type { GameEventBase } from "./game-event-base";

export interface StatusRemovedEvent extends GameEventBase {
  readonly type: EventType.StatusRemoved;
  readonly targetId: CombatantId;
  readonly statusType: StatusType;
}
