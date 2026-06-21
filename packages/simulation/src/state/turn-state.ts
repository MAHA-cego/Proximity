import type { CombatantId } from "../core";

export interface TurnState {
  readonly number: number;

  readonly activeCombatantId: CombatantId;
}
