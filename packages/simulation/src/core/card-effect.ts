import type { DamageEffect } from "./damage-effect";
import type { HealEffect } from "./heal-effect";
import type { ReduceCooldownEffect } from "./reduce-cooldown-effect";
import type { RefreshCooldownEffect } from "./refresh-cooldown-effect";

export type CardEffect =
  | DamageEffect
  | HealEffect
  | ReduceCooldownEffect
  | RefreshCooldownEffect;
