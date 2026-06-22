import type { CombatantId } from "../core";
import { EventType } from "./event-type";
import type { GameEventBase } from "./game-event-base";

export interface HealingDoneEvent extends GameEventBase {
  readonly type: EventType.HealingDone;
  readonly sourceId: CombatantId;
  readonly targetId: CombatantId;
  readonly amount: number;
}
