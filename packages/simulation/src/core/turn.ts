import type { CombatantId } from "./ids";

export interface Turn {
  readonly number: number;
  readonly activeCombatantId: CombatantId;
}
