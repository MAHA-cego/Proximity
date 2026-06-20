import { EffectType } from "./effect-type";

export interface ReduceCooldownEffect {
  readonly type: EffectType.ReduceCooldown;
  readonly amount: number;
}
