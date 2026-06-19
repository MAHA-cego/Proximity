import type { GameEventBase } from "./game-event-base";
import { EventType } from "./event-type";

export interface MatchEndedEvent extends GameEventBase {
  readonly type: EventType.MatchEnded;
}
