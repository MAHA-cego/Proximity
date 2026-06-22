import type { CombatantId, ModifierType } from "../core";
import { EventType } from "./event-type";
import type { GameEventBase } from "./game-event-base";

export interface ModifierAppliedEvent extends GameEventBase {
  readonly type: EventType.ModifierApplied;
  readonly sourceId: CombatantId;
  readonly targetId: CombatantId;
  readonly modifierType: ModifierType;
  readonly amount: number;
}
