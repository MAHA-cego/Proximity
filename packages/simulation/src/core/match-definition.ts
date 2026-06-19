import type { CardDefinition } from "./card-definition";
import type { CardDefinitionId } from "./ids";
import type { MatchPlayer } from "./match-player";

export interface MatchDefinition {
  readonly players: readonly MatchPlayer[];

  readonly cardDefinitions: ReadonlyMap<CardDefinitionId, CardDefinition>;
}
