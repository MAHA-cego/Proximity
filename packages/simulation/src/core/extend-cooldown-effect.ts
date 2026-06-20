import { EffectType } from "./effect-type";

export interface ExtendCooldownEffect {
  readonly type: EffectType.ExtendCooldown;
  readonly amount: number;
}
