import type { PlayerId } from "../core";

export interface TurnState {
  readonly number: number;

  readonly activePlayerId: PlayerId;
}
