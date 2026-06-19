import type { Player } from "../core";

export interface PlayerState {
  readonly player: Player;

  readonly health: number;
}
