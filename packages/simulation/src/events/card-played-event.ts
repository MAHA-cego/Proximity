import type { CombatantId, CardDefinitionId } from "../core";
import { EventType } from "./event-type";
import type { GameEventBase } from "./game-event-base";

export interface CardPlayedEvent extends GameEventBase {
  readonly type: EventType.CardPlayed;
  readonly actorId: CombatantId;
  readonly cardDefinitionId: CardDefinitionId;
}
