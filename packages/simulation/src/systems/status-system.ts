import { ActionType } from "../actions";
import { StatusType } from "../core";
import type { ExecutionContext } from "../engine/execution-context";

import type { GameSystem } from "./game-system";

export class StatusSystem implements GameSystem {
  public execute(context: ExecutionContext): void {
    if (context.action.type !== ActionType.EndTurn) return;

    const activeCombatantId = context.state.turn.activeCombatantId;
    const combatantIndex = context.state.combatants.findIndex(
      (cs) => cs.combatant.id === activeCombatantId,
    );
    const combatantState = context.state.combatants[combatantIndex];

    if (combatantState.statuses.length === 0) return;

    for (const status of combatantState.statuses) {
      switch (status.type) {
        case StatusType.Burn: {
          const { state } = context;
          const target = state.combatants[combatantIndex];
          const updatedCombatants = [
            ...state.combatants.slice(0, combatantIndex),
            { ...target, health: target.health - status.amount },
            ...state.combatants.slice(combatantIndex + 1),
          ];
          context.replaceState({ ...state, combatants: updatedCombatants });
          break;
        }

        case StatusType.Regeneration: {
          const { state } = context;
          const target = state.combatants[combatantIndex];
          const matchCombatant = context.definition.combatants.find(
            (mc) => mc.combatant.id === activeCombatantId,
          )!;
          const maxHealth = matchCombatant.combatant.maxHealth;
          const updatedCombatants = [
            ...state.combatants.slice(0, combatantIndex),
            {
              ...target,
              health: Math.min(target.health + status.amount, maxHealth),
            },
            ...state.combatants.slice(combatantIndex + 1),
          ];
          context.replaceState({ ...state, combatants: updatedCombatants });
          break;
        }

        case StatusType.Shield:
          break;
      }
    }

    const { state } = context;
    const latestCombatant = state.combatants[combatantIndex];
    const updatedStatuses = latestCombatant.statuses
      .map((s) => ({ ...s, remainingDuration: s.remainingDuration - 1 }))
      .filter((s) => s.remainingDuration > 0);
    const updatedCombatants = [
      ...state.combatants.slice(0, combatantIndex),
      { ...latestCombatant, statuses: updatedStatuses },
      ...state.combatants.slice(combatantIndex + 1),
    ];
    context.replaceState({ ...state, combatants: updatedCombatants });
  }
}
