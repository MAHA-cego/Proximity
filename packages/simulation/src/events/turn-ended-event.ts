import type { PlayerId } from "../core";
import type { GameEventBase } from "./game-event-base";
import { EventType } from "./event-type";

export interface TurnEndedEvent extends GameEventBase {
  readonly type: EventType.TurnEnded;

  readonly playerId: PlayerId;
}
