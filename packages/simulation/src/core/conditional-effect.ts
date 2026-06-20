import { EffectType } from "./effect-type";
import type { AbilityRequirement } from "./ability-requirement";
import type { LeafEffect } from "./leaf-effect";

export interface ConditionalEffect {
  readonly type: EffectType.Conditional;
  readonly condition: AbilityRequirement;
  readonly effects: readonly LeafEffect[];
}
