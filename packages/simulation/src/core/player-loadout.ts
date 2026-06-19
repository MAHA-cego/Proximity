import type { CardDefinitionId } from "./ids";

export interface PlayerLoadout {
  readonly cardDefinitionIds: readonly CardDefinitionId[];
}
