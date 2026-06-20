import type { ApplyModifierEffect } from "./apply-modifier-effect";
import type { DamageEffect } from "./damage-effect";
import type { ExtendCooldownEffect } from "./extend-cooldown-effect";
import type { HealEffect } from "./heal-effect";
import type { ReduceCooldownEffect } from "./reduce-cooldown-effect";
import type { RefreshCooldownEffect } from "./refresh-cooldown-effect";

export type LeafEffect =
  | DamageEffect
  | HealEffect
  | ReduceCooldownEffect
  | RefreshCooldownEffect
  | ExtendCooldownEffect
  | ApplyModifierEffect;
