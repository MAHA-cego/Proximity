import { EffectType } from "./effect-type";
import type { StatusType } from "./status-type";

export interface ApplyStatusEffect {
  readonly type: EffectType.ApplyStatus;
  readonly statusType: StatusType;
  readonly duration: number;
  readonly amount: number;
}
