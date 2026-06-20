import type { ConditionalEffect } from "./conditional-effect";
import type { EffectGroup } from "./effect-group";
import type { LeafEffect } from "./leaf-effect";

export type CardEffect = LeafEffect | ConditionalEffect | EffectGroup;
