import type { PlayerLoadout } from "./player-loadout";
import type { Player } from "./player";

export interface MatchPlayer {
  readonly player: Player;

  readonly loadout: PlayerLoadout;
}
