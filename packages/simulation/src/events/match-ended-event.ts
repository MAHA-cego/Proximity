import type { PlayerId } from "../core";

import { EventType } from "./event-type";
import type { GameEventBase } from "./game-event-base";

export interface MatchEndedEvent extends GameEventBase {
  readonly type: EventType.MatchEnded;

  readonly winnerId: PlayerId;

  readonly loserId: PlayerId;
}
