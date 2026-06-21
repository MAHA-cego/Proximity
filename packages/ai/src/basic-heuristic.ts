import {
  AbilityTrigger,
  ActionType,
  checkRequirement,
  type GameAction,
  type GameState,
  type MatchDefinition,
} from "@proximity/simulation";

import type { AiAgent } from "./ai-agent";

class BasicHeuristicAi implements AiAgent {
  selectAction(state: GameState, definition: MatchDefinition): GameAction {
    const actorId = state.turn.activeCombatantId;
    const combatantState = state.combatants.find(
      (cs) => cs.combatant.id === actorId,
    )!;

    for (const card of combatantState.cards) {
      if (card.remainingCooldown > 0) continue;

      const cardDefinition = definition.cardDefinitions.get(card.definitionId)!;

      const usable = cardDefinition.abilities
        .filter((a) => a.trigger === AbilityTrigger.OnUse)
        .every((a) =>
          (a.requirements ?? []).every((req) =>
            checkRequirement(state, req, actorId),
          ),
        );

      if (usable) {
        return {
          type: ActionType.UseCard,
          actorId,
          cardInstanceId: card.instanceId,
        };
      }
    }

    return { type: ActionType.EndTurn, actorId };
  }
}

export function createBasicHeuristicAi(): AiAgent {
  return new BasicHeuristicAi();
}
