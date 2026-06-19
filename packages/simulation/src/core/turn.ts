import type { PlayerId } from "./ids";

export interface Turn {
  readonly number: number;
  readonly activePlayerId: PlayerId;
}
