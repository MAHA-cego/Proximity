import {
  AbilityTrigger,
  ActionType,
  checkRequirement,
  GUARD_ID,
  HEAVY_STRIKE_ID,
  ModifierType,
  PREPARATION_ID,
  RECOVER_ID,
  REGENERATION_ID,
  SLASH_ID,
  StatusType,
  type CardDefinitionId,
  type GameAction,
  type GameState,
  type MatchDefinition,
} from "@proximity/simulation";

import type { AiAgent } from "./ai-agent";

class CorruptedHunterDoctrine implements AiAgent {
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

    const priority = this.selectPriority(state, actorState);

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
  ): readonly CardDefinitionId[] {
    const turnNumber = state.turn.number;
    const selfHealth = actorState.health;
    const maxHealth = actorState.combatant.maxHealth;

    // Emergency: life is at risk
    if (selfHealth <= maxHealth * 0.4) {
      const hasRegeneration = actorState.statuses.some(
        (s) => s.type === StatusType.Regeneration,
      );
      if (hasRegeneration) {
        // Already healing — use the window to fight back rather than stack more defence
        return [
          HEAVY_STRIKE_ID,
          RECOVER_ID,
          SLASH_ID,
          PREPARATION_ID,
          GUARD_ID,
          REGENERATION_ID,
        ];
      }
      // Not yet recovering — establish it first, but hit back immediately after
      return [
        RECOVER_ID,
        REGENERATION_ID,
        HEAVY_STRIKE_ID,
        SLASH_ID,
        GUARD_ID,
        PREPARATION_ID,
      ];
    }

    const enemyState = state.combatants.find(
      (cs) => cs.combatant.id !== actorState.combatant.id,
    )!;
    const opponentIsHealing = enemyState.statuses.some(
      (s) => s.type === StatusType.Regeneration,
    );

    if (opponentIsHealing) {
      // End the fight before sustained recovery neutralises the advantage
      return [
        HEAVY_STRIKE_ID,
        PREPARATION_ID,
        SLASH_ID,
        GUARD_ID,
        REGENERATION_ID,
        RECOVER_ID,
      ];
    }

    const hasDamageModifier = actorState.modifiers.some(
      (m) => m.type === ModifierType.Damage,
    );

    if (hasDamageModifier) {
      // Preparation is active; follow with Heavy Strike.
      // Occasionally delay to remain less predictable.
      const delay = turnNumber % 6 === 0;
      return delay
        ? [
            SLASH_ID,
            HEAVY_STRIKE_ID,
            REGENERATION_ID,
            GUARD_ID,
            RECOVER_ID,
            PREPARATION_ID,
          ]
        : [
            HEAVY_STRIKE_ID,
            SLASH_ID,
            REGENERATION_ID,
            GUARD_ID,
            RECOVER_ID,
            PREPARATION_ID,
          ];
    }

    if (turnNumber <= 2) {
      // Opening: establish Preparation immediately
      return [
        PREPARATION_ID,
        REGENERATION_ID,
        GUARD_ID,
        HEAVY_STRIKE_ID,
        SLASH_ID,
        RECOVER_ID,
      ];
    }

    // Default: patient positioning — prepare before striking, Slash fills every gap
    return [
      PREPARATION_ID,
      HEAVY_STRIKE_ID,
      SLASH_ID,
      REGENERATION_ID,
      GUARD_ID,
      RECOVER_ID,
    ];
  }
}

export function createCorruptedHunterAi(): AiAgent {
  return new CorruptedHunterDoctrine();
}
