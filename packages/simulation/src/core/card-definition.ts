import type { CardDefinitionId } from "./ids";

export interface CardDefinition {
  readonly id: CardDefinitionId;

  readonly cooldown: number;
}
