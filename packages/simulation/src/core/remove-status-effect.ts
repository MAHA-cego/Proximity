import { EffectType } from "./effect-type";
import type { StatusType } from "./status-type";

export interface RemoveStatusEffect {
  readonly type: EffectType.RemoveStatus;
  readonly statusType: StatusType;
}
