import {
  AbilityTrigger,
  ActionType,
  checkRequirement,
  EXPLOIT_ID,
  FEINT_ID,
  GUARD_ID,
  PARRY_ID,
  RECOVER_ID,
  SLASH_ID,
  StatusType,
  type CardDefinitionId,
  type GameAction,
  type GameState,
  type MatchDefinition,
} from "@proximity/simulation";

import type { AiAgent } from "./ai-agent";

class CorruptedMilitiamanDoctrine implements AiAgent {
  selectAction(state: GameState, definition: MatchDefinition): GameAction {
    const actorId = state.turn.activeCombatantId;
    const actorState = state.combatants.find(
      (cs) => cs.combatant.id === actorId,
    )!;

    if (actorState.statuses.some((s) => s.preventsCardPlay)) {
      return { type: ActionType.EndTurn, actorId };
    }

    const playable = actorState.cards.filter((card) => {
      if (card.remainingCooldown > 0) return false;
      if (
        actorState.statuses.some((s) =>
          s.restrictedCardIds?.includes(card.definitionId),
        )
      )
        return false;
      const cardDef = definition.cardDefinitions.get(card.definitionId);
      if (!cardDef) return false;
      return cardDef.abilities
        .filter((a) => a.trigger === AbilityTrigger.OnUse)
        .every((a) =>
          (a.requirements ?? []).every((req) =>
            checkRequirement(state, req, actorId),
          ),
        );
    });

    if (playable.length === 0) return { type: ActionType.EndTurn, actorId };

    const priority = this.selectPriority(state, actorState, playable);

    for (const cardId of priority) {
      const card = playable.find((c) => c.definitionId === cardId);
      if (card) {
        return {
          type: ActionType.UseCard,
          actorId,
          cardInstanceId: card.instanceId,
        };
      }
    }

    return { type: ActionType.EndTurn, actorId };
  }

  private selectPriority(
    state: GameState,
    actorState: GameState["combatants"][number],
    playable: GameState["combatants"][number]["cards"],
  ): readonly CardDefinitionId[] {
    const turnNumber = state.turn.number;
    const enemyState = state.combatants.find(
      (cs) => cs.combatant.id !== actorState.combatant.id,
    )!;

    // Commit to Exploit the moment both conditions are met — patience rewarded
    const exploitReady = playable.some((c) => c.definitionId === EXPLOIT_ID);
    if (exploitReady) {
      return [EXPLOIT_ID, SLASH_ID, GUARD_ID, PARRY_ID, FEINT_ID, RECOVER_ID];
    }

    // Enemy has Opening: press with Slash to drive health toward the Exploit threshold
    const enemyHasOpening = enemyState.statuses.some(
      (s) => s.type === StatusType.Opening,
    );
    if (enemyHasOpening) {
      return [SLASH_ID, GUARD_ID, PARRY_ID, FEINT_ID, RECOVER_ID, EXPLOIT_ID];
    }

    // Feint opportunity: enemy is hurting and likely to respond defensively
    const feintOpportunity =
      enemyState.health <= enemyState.combatant.maxHealth * 0.6;
    if (feintOpportunity) {
      // If FeintActive is already running and the enemy hasn't taken the bait,
      // press with Slash instead of wasting the next Feint on an unreceptive target
      const selfHasFeintActive = actorState.statuses.some(
        (s) => s.type === StatusType.FeintActive,
      );
      if (selfHasFeintActive) {
        return [SLASH_ID, PARRY_ID, GUARD_ID, FEINT_ID, RECOVER_ID, EXPLOIT_ID];
      }
      return [FEINT_ID, SLASH_ID, GUARD_ID, PARRY_ID, RECOVER_ID, EXPLOIT_ID];
    }

    // Opening turns: establish Guard while observing the opponent
    if (turnNumber <= 2) {
      return [GUARD_ID, FEINT_ID, SLASH_ID, PARRY_ID, RECOVER_ID, EXPLOIT_ID];
    }

    // Late game: if the fight has dragged on without Exploit conditions materialising,
    // abandon patience and press damage
    if (turnNumber > 8) {
      return [SLASH_ID, FEINT_ID, PARRY_ID, GUARD_ID, RECOVER_ID, EXPLOIT_ID];
    }

    // Default: proactive defence first, offence second, Recover last
    return [GUARD_ID, SLASH_ID, PARRY_ID, FEINT_ID, RECOVER_ID, EXPLOIT_ID];
  }
}

export function createCorruptedMilitiamanAi(): AiAgent {
  return new CorruptedMilitiamanDoctrine();
}
