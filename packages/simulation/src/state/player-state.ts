import type { Player, RuntimeModifier } from "../core";

import type { PlayerCardState } from "./player-card-state";

export interface PlayerState {
  readonly player: Player;

  readonly health: number;

  readonly cards: readonly PlayerCardState[];

  readonly modifiers: readonly RuntimeModifier[];
}
