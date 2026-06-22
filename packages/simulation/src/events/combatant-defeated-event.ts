import type { CombatantId } from "../core";
import { EventType } from "./event-type";
import type { GameEventBase } from "./game-event-base";

export interface CombatantDefeatedEvent extends GameEventBase {
  readonly type: EventType.CombatantDefeated;
  readonly combatantId: CombatantId;
}
