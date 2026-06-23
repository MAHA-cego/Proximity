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
  private observations = 0;
  private defensiveObservations = 0;
  private parryObservations = 0;
  private lastObservedTurn = -1;

  selectAction(state: GameState, definition: MatchDefinition): GameAction {
    const actorId = state.turn.activeCombatantId;
    const actorState = state.combatants.find(
      (cs) => cs.combatant.id === actorId,
    )!;
    const enemyState = state.combatants.find(
      (cs) => cs.combatant.id !== actorId,
    )!;

    this.observeOpponent(state.turn.number, enemyState);

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

    const priority = this.selectPriority(
      state,
      actorState,
      enemyState,
      playable,
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

  private observeOpponent(
    turnNumber: number,
    enemyState: GameState["combatants"][number],
  ): void {
    if (turnNumber === this.lastObservedTurn) return;
    this.lastObservedTurn = turnNumber;
    this.observations++;
    const hasParry = enemyState.statuses.some(
      (s) => s.type === StatusType.Parry,
    );
    const hasShield = enemyState.statuses.some(
      (s) => s.type === StatusType.Shield,
    );
    if (hasParry) this.parryObservations++;
    if (hasParry || hasShield) this.defensiveObservations++;
  }

  private selectPriority(
    state: GameState,
    actorState: GameState["combatants"][number],
    enemyState: GameState["combatants"][number],
    playable: GameState["combatants"][number]["cards"],
  ): readonly CardDefinitionId[] {
    const turnNumber = state.turn.number;

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

    // Opening turns: establish Guard while reading the opponent
    if (turnNumber <= 3) {
      return [GUARD_ID, FEINT_ID, PARRY_ID, SLASH_ID, RECOVER_ID, EXPLOIT_ID];
    }

    // Late game: if the fight has dragged on without Exploit materialising,
    // abandon patience and press damage
    if (turnNumber > 8) {
      return [SLASH_ID, FEINT_ID, PARRY_ID, GUARD_ID, RECOVER_ID, EXPLOIT_ID];
    }

    // Memory-informed: opponent consistently uses Parry or Guard.
    // Slash is being absorbed or reflected — Feint is the correct response
    // because it strips their ability to play Guard/Parry without consequence.
    const opponentIsDefensive =
      this.observations >= 3 &&
      (this.parryObservations / this.observations > 0.4 ||
        this.defensiveObservations / this.observations > 0.5);
    if (opponentIsDefensive) {
      const selfHasFeintActive = actorState.statuses.some(
        (s) => s.type === StatusType.FeintActive,
      );
      if (selfHasFeintActive) {
        // Feint already running — press with Slash while waiting for reaction
        return [SLASH_ID, GUARD_ID, PARRY_ID, FEINT_ID, RECOVER_ID, EXPLOIT_ID];
      }
      return [FEINT_ID, GUARD_ID, PARRY_ID, SLASH_ID, RECOVER_ID, EXPLOIT_ID];
    }

    // Memory-informed: opponent consistently aggressive — mirror with Parry
    // to reflect their attacks and reduce Feint (they never defend, so it won't trigger)
    const opponentIsAggressive =
      this.observations >= 3 &&
      this.defensiveObservations / this.observations < 0.2;
    if (opponentIsAggressive) {
      return [PARRY_ID, GUARD_ID, FEINT_ID, SLASH_ID, RECOVER_ID, EXPLOIT_ID];
    }

    // Feint opportunity: enemy is hurting and likely to tighten their defence
    const feintOpportunity =
      enemyState.health <= enemyState.combatant.maxHealth * 0.6;
    if (feintOpportunity) {
      const selfHasFeintActive = actorState.statuses.some(
        (s) => s.type === StatusType.FeintActive,
      );
      if (selfHasFeintActive) {
        // Feint already running; press Slash while the trap is set
        return [SLASH_ID, PARRY_ID, GUARD_ID, FEINT_ID, RECOVER_ID, EXPLOIT_ID];
      }
      return [FEINT_ID, SLASH_ID, GUARD_ID, PARRY_ID, RECOVER_ID, EXPLOIT_ID];
    }

    // Default: proactive defence first, create Feint setup before pressing Slash
    return [GUARD_ID, FEINT_ID, SLASH_ID, PARRY_ID, RECOVER_ID, EXPLOIT_ID];
  }
}

export function createCorruptedMilitiamanAi(): AiAgent {
  return new CorruptedMilitiamanDoctrine();
}
