import { EffectType } from "./effect-type";
import type { ConditionalEffect } from "./conditional-effect";
import type { LeafEffect } from "./leaf-effect";

export interface EffectGroup {
  readonly type: EffectType.Group;
  readonly effects: readonly (LeafEffect | ConditionalEffect)[];
}
