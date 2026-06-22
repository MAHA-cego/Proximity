import type { CombatantId, StatusType } from "../core";
import { EventType } from "./event-type";
import type { GameEventBase } from "./game-event-base";

export interface StatusAppliedEvent extends GameEventBase {
  readonly type: EventType.StatusApplied;
  readonly sourceId: CombatantId;
  readonly targetId: CombatantId;
  readonly statusType: StatusType;
  readonly amount: number;
  readonly duration: number;
}
