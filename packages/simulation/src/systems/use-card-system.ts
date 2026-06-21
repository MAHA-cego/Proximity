import { ActionType } from "../actions";
import { AbilityTrigger } from "../core";
import { dispatchTrigger } from "../effects";
import type { ExecutionContext } from "../engine/execution-context";

import type { GameSystem } from "./game-system";

export class UseCardSystem implements GameSystem {
  public execute(context: ExecutionContext): void {
    const { action } = context;

    if (action.type !== ActionType.UseCard) {
      return;
    }

    const { state } = context;

    const combatantIndex = state.combatants.findIndex(
      (cs) => cs.combatant.id === action.actorId,
    );

    const combatantState = state.combatants[combatantIndex];

    const cardIndex = combatantState.cards.findIndex(
      (c) => c.instanceId === action.cardInstanceId,
    );

    const card = combatantState.cards[cardIndex];

    const cardDefinition = context.definition.cardDefinitions.get(
      card.definitionId,
    )!;

    const updatedCards = [
      ...combatantState.cards.slice(0, cardIndex),
      { ...card, remainingCooldown: cardDefinition.cooldown },
      ...combatantState.cards.slice(cardIndex + 1),
    ];

    const updatedCombatants = [
      ...state.combatants.slice(0, combatantIndex),
      { ...combatantState, cards: updatedCards },
      ...state.combatants.slice(combatantIndex + 1),
    ];

    context.replaceState({ ...state, combatants: updatedCombatants });

    dispatchTrigger(context, AbilityTrigger.OnUse, cardDefinition.abilities);
  }
}
