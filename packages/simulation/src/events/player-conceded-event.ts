import type { PlayerId } from "../core";
import type { GameEventBase } from "./game-event-base";
import { EventType } from "./event-type";

export interface PlayerConcededEvent extends GameEventBase {
  readonly type: EventType.PlayerConceded;

  readonly playerId: PlayerId;
}
