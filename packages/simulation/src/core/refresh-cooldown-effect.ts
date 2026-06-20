import { EffectType } from "./effect-type";
import type { CardDefinitionId } from "./ids";

export interface RefreshCooldownEffect {
  readonly type: EffectType.RefreshCooldown;
  readonly cardDefinitionId: CardDefinitionId;
}
