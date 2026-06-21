import { EffectType } from "./effect-type";
import type { CardDefinitionId } from "./ids";
import type { LeafEffect } from "./leaf-effect";
import type { StatusType } from "./status-type";

export interface ApplyStatusEffect {
  readonly type: EffectType.ApplyStatus;
  readonly statusType: StatusType;
  readonly duration: number;
  readonly amount: number;
  readonly restrictedCardIds?: readonly CardDefinitionId[];
  readonly preventsCardPlay?: boolean;
  readonly onExpiry?: readonly LeafEffect[];
}
