import type { AbilityRequirement } from "./ability-requirement";
import type { AbilityTrigger } from "./ability-trigger";
import type { CardEffect } from "./card-effect";
import type { Targeting } from "./targeting";

export interface CardAbility {
  readonly trigger: AbilityTrigger;

  readonly targeting: Targeting;

  readonly effects: readonly CardEffect[];

  readonly requirements?: readonly AbilityRequirement[];
}
