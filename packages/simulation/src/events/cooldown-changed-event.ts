import type { CombatantId, CardDefinitionId } from "../core";
import { EventType } from "./event-type";
import type { GameEventBase } from "./game-event-base";

export interface CooldownChangedEvent extends GameEventBase {
  readonly type: EventType.CooldownChanged;
  readonly targetId: CombatantId;
  readonly cardDefinitionId: CardDefinitionId;
  readonly previousCooldown: number;
  readonly newCooldown: number;
}
