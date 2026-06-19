import type { CardDefinitionId, CardInstanceId } from "../core";

export interface PlayerCardState {
  readonly instanceId: CardInstanceId;

  readonly definitionId: CardDefinitionId;

  readonly remainingCooldown: number;
}
