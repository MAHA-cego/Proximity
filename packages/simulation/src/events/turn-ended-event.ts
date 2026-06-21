import type { CombatantId } from "../core";
import type { GameEventBase } from "./game-event-base";
import { EventType } from "./event-type";

export interface TurnEndedEvent extends GameEventBase {
  readonly type: EventType.TurnEnded;

  readonly combatantId: CombatantId;
}
