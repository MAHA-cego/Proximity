import type { CardDefinitionId, CardInstanceId } from "../core";

export interface CombatantCardState {
  readonly instanceId: CardInstanceId;

  readonly definitionId: CardDefinitionId;

  readonly remainingCooldown: number;
}
