import type { EventType } from "./event-type";

export interface GameEventBase {
  readonly type: EventType;
}
