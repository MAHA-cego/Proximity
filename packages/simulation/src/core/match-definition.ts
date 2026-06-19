import type { CardDefinition } from "./card-definition";
import type { MatchPlayer } from "./match-player";

export interface MatchDefinition {
  readonly players: readonly MatchPlayer[];

  readonly cardDefinitions: readonly CardDefinition[];
}
