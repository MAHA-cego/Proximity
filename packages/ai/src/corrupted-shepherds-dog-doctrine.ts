import {
  AbilityTrigger,
  ActionType,
  BATTLE_CRY_ID,
  BERSERK_ID,
  checkRequirement,
  HEAVY_STRIKE_ID,
  LACERATION_ID,
  ModifierType,
  PARRY_ID,
  SLASH_ID,
  StatusType,
  type CardDefinitionId,
  type GameAction,
  type GameState,
  type MatchDefinition,
} from "@proximity/simulation";

import type { AiAgent } from "./ai-agent";

class CorruptedShepherdsDogDoctrine implements AiAgent {
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

    const isBerserkActive = actorState.statuses.some(
      (s) => s.type === StatusType.Berserk,
    );
    const hasDamageModifier = actorState.modifiers.some(
      (m) => m.type === ModifierType.Damage,
    );

    const priority = this.selectPriority(
      state,
      actorState,
      isBerserkActive,
      hasDamageModifier,
    );

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
    isBerserkActive: boolean,
    hasDamageModifier: boolean,
  ): readonly CardDefinitionId[] {
    if (isBerserkActive) {
      // During Berserk: attack immediately; BattleCry only if every strike is on cooldown
      return [HEAVY_STRIKE_ID, SLASH_ID, LACERATION_ID, BATTLE_CRY_ID];
    }

    const turnNumber = state.turn.number;

    if (actorState.health < 30) {
      // Brief hesitation: one dog turn in every four defers Berserk in favour of attacks
      const hesitate = turnNumber % 4 === 0;
      return hesitate
        ? [
            HEAVY_STRIKE_ID,
            SLASH_ID,
            LACERATION_ID,
            BATTLE_CRY_ID,
            BERSERK_ID,
            PARRY_ID,
          ]
        : [
            BERSERK_ID,
            HEAVY_STRIKE_ID,
            SLASH_ID,
            LACERATION_ID,
            BATTLE_CRY_ID,
            PARRY_ID,
          ];
    }

    const enemyState = state.combatants.find(
      (cs) => cs.combatant.id !== actorState.combatant.id,
    )!;
    const enemyHasBleeding = enemyState.statuses.some(
      (s) => s.type === StatusType.Bleeding,
    );

    if (enemyHasBleeding) {
      // Bleeding is ticking — press every attack; BattleCry only when nothing else is ready
      // and no modifier is already waiting to be consumed
      if (hasDamageModifier) {
        return [
          HEAVY_STRIKE_ID,
          LACERATION_ID,
          SLASH_ID,
          PARRY_ID,
          BATTLE_CRY_ID,
        ];
      }
      return [
        HEAVY_STRIKE_ID,
        LACERATION_ID,
        SLASH_ID,
        BATTLE_CRY_ID,
        PARRY_ID,
      ];
    }

    if (turnNumber <= 2) {
      // Opening: establish Bleeding immediately
      return [
        LACERATION_ID,
        BATTLE_CRY_ID,
        HEAVY_STRIKE_ID,
        SLASH_ID,
        PARRY_ID,
      ];
    }

    // Mid-game: attack with every available strike; BattleCry only as a filler
    if (hasDamageModifier) {
      return [
        HEAVY_STRIKE_ID,
        LACERATION_ID,
        SLASH_ID,
        PARRY_ID,
        BATTLE_CRY_ID,
      ];
    }
    return [HEAVY_STRIKE_ID, LACERATION_ID, SLASH_ID, BATTLE_CRY_ID, PARRY_ID];
  }
}

export function createCorruptedShepherdsDogAi(): AiAgent {
  return new CorruptedShepherdsDogDoctrine();
}
