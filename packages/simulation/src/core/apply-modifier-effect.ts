import { EffectType } from "./effect-type";
import type { ModifierType } from "./modifier-type";

export interface ApplyModifierEffect {
  readonly type: EffectType.ApplyModifier;
  readonly modifierType: ModifierType;
  readonly amount: number;
  readonly uses?: number;
  readonly duration?: number;
}
