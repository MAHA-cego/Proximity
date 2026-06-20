import { EffectType } from "./effect-type";

export interface HealEffect {
  readonly type: EffectType.Heal;

  readonly amount: number;
}
