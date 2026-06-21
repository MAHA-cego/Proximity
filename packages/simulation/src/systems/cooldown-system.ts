import { ActionType } from "../actions";
import { AbilityTrigger } from "../core";
import { dispatchTrigger } from "../effects";
import type { ExecutionContext } from "../engine/execution-context";

import type { GameSystem } from "./game-system";

export class CooldownSystem implements GameSystem {
  public execute(context: ExecutionContext): void {
    if (context.action.type !== ActionType.EndTurn) {
      return;
    }

    const activeCombatantId = context.state.turn.activeCombatantId;

    const combatantIndex = context.state.combatants.findIndex(
      (cs) => cs.combatant.id === activeCombatantId,
    );

    const combatantState = context.state.combatants[combatantIndex];

    const updatedCards = combatantState.cards.map((card) => ({
      ...card,
      remainingCooldown: Math.max(0, card.remainingCooldown - 1),
    }));

    const updatedModifiers = combatantState.modifiers
      .map((m) =>
        m.remainingDuration !== undefined
          ? { ...m, remainingDuration: m.remainingDuration - 1 }
          : m,
      )
      .filter(
        (m) => m.remainingDuration === undefined || m.remainingDuration > 0,
      );

    const updatedCombatants = [
      ...context.state.combatants.slice(0, combatantIndex),
      { ...combatantState, cards: updatedCards, modifiers: updatedModifiers },
      ...context.state.combatants.slice(combatantIndex + 1),
    ];

    context.replaceState({
      ...context.state,
      combatants: updatedCombatants,
    });

    const updatedCombatantState = context.state.combatants[combatantIndex];

    for (const card of updatedCombatantState.cards) {
      const cardDefinition = context.definition.cardDefinitions.get(
        card.definitionId,
      )!;

      dispatchTrigger(
        context,
        AbilityTrigger.OnTurnStart,
        cardDefinition.abilities,
        updatedCombatantState.combatant.id,
      );
    }
  }
}
