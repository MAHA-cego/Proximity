import type { MatchPlayer } from "./match-player";

export interface MatchDefinition {
  readonly players: readonly MatchPlayer[];
}
