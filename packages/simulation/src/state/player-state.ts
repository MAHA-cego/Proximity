import type {
  CombatantDefinition,
  RuntimeModifier,
  RuntimeStatus,
} from "../core";

import type { CombatantCardState } from "./player-card-state";

export interface CombatantState {
  readonly combatant: CombatantDefinition;

  readonly health: number;

  readonly cards: readonly CombatantCardState[];

  readonly modifiers: readonly RuntimeModifier[];

  readonly statuses: readonly RuntimeStatus[];
}
