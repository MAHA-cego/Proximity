import { ActionType } from "../actions";
import { AbilityTrigger, type MatchDefinition, type MatchId } from "../core";
import { checkRequirement, dispatchTrigger } from "../effects";
import { IllegalActionError, InvalidActionError } from "../errors";
import { createGame } from "../initialization";
import type { GameState } from "../state";

import { SystemRegistry } from "../systems";

import { ExecutionContext } from "./execution-context";
import type { EngineResult } from "./engine-result";
import type { GameAction } from "../actions";

export class Engine {
  public constructor(private readonly registry: SystemRegistry) {}

  public executeAction(
    state: GameState,
    action: GameAction,
    definition: MatchDefinition,
  ): EngineResult {
    const context = new ExecutionContext(state, action, definition);

    this.validateAction(context);
    this.registry.execute(context);

    return {
      state: context.state,
      events: context.getEvents(),
    };
  }

  public initializeGame(
    matchId: MatchId,
    definition: MatchDefinition,
  ): GameState {
    const state = createGame({ matchId, definition });

    const syntheticAction = {
      type: ActionType.Pass as const,
      actorId: state.combatants[0].combatant.id,
    };

    const context = new ExecutionContext(state, syntheticAction, definition);

    for (const combatantState of state.combatants) {
      for (const card of combatantState.cards) {
        const cardDefinition = definition.cardDefinitions.get(
          card.definitionId,
        )!;

        dispatchTrigger(
          context,
          AbilityTrigger.Passive,
          cardDefinition.abilities,
          combatantState.combatant.id,
        );
      }
    }

    return context.state;
  }

  private validateAction(context: ExecutionContext): void {
    const { action, state } = context;

    if (action.type !== ActionType.UseCard) return;

    if (action.actorId !== state.turn.activeCombatantId) {
      throw IllegalActionError.notActivePlayer();
    }

    let cardExists = false;
    let cardOwned = false;

    for (const cs of state.combatants) {
      const found = cs.cards.some(
        (c) => c.instanceId === action.cardInstanceId,
      );
      if (found) {
        cardExists = true;
        cardOwned = cs.combatant.id === action.actorId;
        break;
      }
    }

    if (!cardExists) throw InvalidActionError.cardNotFound();
    if (!cardOwned) throw InvalidActionError.cardNotOwned();

    const combatantState = state.combatants.find(
      (cs) => cs.combatant.id === action.actorId,
    )!;
    const card = combatantState.cards.find(
      (c) => c.instanceId === action.cardInstanceId,
    )!;

    if (card.remainingCooldown > 0) throw InvalidActionError.cardOnCooldown();

    const cardDefinition = context.definition.cardDefinitions.get(
      card.definitionId,
    )!;

    for (const ability of cardDefinition.abilities) {
      if (ability.trigger !== AbilityTrigger.OnUse) continue;
      for (const req of ability.requirements ?? []) {
        if (!checkRequirement(context.state, req, action.actorId)) {
          throw InvalidActionError.requirementNotMet();
        }
      }
    }

    for (const status of combatantState.statuses) {
      if (status.preventsCardPlay) throw InvalidActionError.requirementNotMet();
      if (status.restrictedCardIds?.includes(card.definitionId)) {
        throw InvalidActionError.requirementNotMet();
      }
    }
  }
}
