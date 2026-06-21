import type { CardDefinition } from "./card-definition";
import type { CardDefinitionId } from "./ids";
import type { MatchCombatant } from "./match-player";

export interface MatchDefinition {
  readonly combatants: readonly MatchCombatant[];

  readonly cardDefinitions: ReadonlyMap<CardDefinitionId, CardDefinition>;
}
