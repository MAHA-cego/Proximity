import { EffectType } from "./effect-type";

export interface DamageEffect {
  readonly type: EffectType.Damage;

  readonly amount: number;
}
