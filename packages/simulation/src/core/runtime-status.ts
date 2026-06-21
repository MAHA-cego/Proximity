import type { CardDefinitionId } from "./ids";
import type { LeafEffect } from "./leaf-effect";
import type { StatusType } from "./status-type";

export interface RuntimeStatus {
  readonly type: StatusType;
  readonly remainingDuration: number;
  readonly amount: number;
  readonly restrictedCardIds?: readonly CardDefinitionId[];
  readonly preventsCardPlay?: boolean;
  readonly onExpiry?: readonly LeafEffect[];
}
