import type { CardDefinitionId } from "./ids";

export interface CombatantLoadout {
  readonly cardDefinitionIds: readonly CardDefinitionId[];
}
