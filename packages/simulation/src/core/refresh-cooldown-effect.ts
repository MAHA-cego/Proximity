import { EffectType } from "./effect-type";

export interface RefreshCooldownEffect {
  readonly type: EffectType.RefreshCooldown;
}
