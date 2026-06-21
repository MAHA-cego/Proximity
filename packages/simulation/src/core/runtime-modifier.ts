import type { ModifierType } from "./modifier-type";

export interface RuntimeModifier {
  readonly type: ModifierType;
  readonly amount: number;
  readonly remainingUses?: number;
  readonly remainingDuration?: number;
}
