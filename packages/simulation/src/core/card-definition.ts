import type { CardAbility } from "./card-ability";
import type { CardDefinitionId } from "./ids";

export interface CardDefinition {
  readonly id: CardDefinitionId;

  readonly cooldown: number;

  readonly abilities: readonly CardAbility[];
}
