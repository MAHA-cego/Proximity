import { EffectType } from "./effect-type";
import type { CardDefinitionId } from "./ids";

export interface ReduceCooldownEffect {
  readonly type: EffectType.ReduceCooldown;
  readonly cardDefinitionId: CardDefinitionId;
  readonly amount: number;
}
