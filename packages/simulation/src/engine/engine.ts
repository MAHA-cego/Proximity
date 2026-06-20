import { ActionType } from "../actions";
import {
  AbilityTrigger,
  Comparison,
  RequirementSubject,
  RequirementType,
  type AbilityRequirement,
  type MatchDefinition,
  type MatchId,
  type PlayerId,
} from "../core";
import { dispatchTrigger } from "../effects";
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
      actorId: state.players[0].player.id,
    };

    const context = new ExecutionContext(state, syntheticAction, definition);

    for (const playerState of state.players) {
      for (const card of playerState.cards) {
        const cardDefinition = definition.cardDefinitions.get(
          card.definitionId,
        )!;

        dispatchTrigger(
          context,
          AbilityTrigger.Passive,
          cardDefinition.abilities,
          playerState.player.id,
        );
      }
    }

    return context.state;
  }

  private validateAction(context: ExecutionContext): void {
    const { action, state } = context;

    if (action.type !== ActionType.UseCard) return;

    if (action.actorId !== state.turn.activePlayerId) {
      throw IllegalActionError.notActivePlayer();
    }

    let cardExists = false;
    let cardOwned = false;

    for (const ps of state.players) {
      const found = ps.cards.some(
        (c) => c.instanceId === action.cardInstanceId,
      );
      if (found) {
        cardExists = true;
        cardOwned = ps.player.id === action.actorId;
        break;
      }
    }

    if (!cardExists) throw InvalidActionError.cardNotFound();
    if (!cardOwned) throw InvalidActionError.cardNotOwned();

    const playerState = state.players.find(
      (ps) => ps.player.id === action.actorId,
    )!;
    const card = playerState.cards.find(
      (c) => c.instanceId === action.cardInstanceId,
    )!;

    if (card.remainingCooldown > 0) throw InvalidActionError.cardOnCooldown();

    const cardDefinition = context.definition.cardDefinitions.get(
      card.definitionId,
    )!;

    for (const ability of cardDefinition.abilities) {
      if (ability.trigger !== AbilityTrigger.OnUse) continue;
      for (const req of ability.requirements ?? []) {
        if (!checkRequirement(context, req, action.actorId)) {
          throw InvalidActionError.requirementNotMet();
        }
      }
    }
  }
}

function checkRequirement(
  context: ExecutionContext,
  req: AbilityRequirement,
  actorId: PlayerId,
): boolean {
  switch (req.type) {
    case RequirementType.Health: {
      const resolvedId =
        req.subject === RequirementSubject.Enemy
          ? context.state.players.find((ps) => ps.player.id !== actorId)?.player
              .id
          : actorId;
      const subjectState = context.state.players.find(
        (ps) => ps.player.id === resolvedId,
      );
      if (!subjectState) return false;
      if (req.comparison === Comparison.Below)
        return subjectState.health < req.threshold;
      return subjectState.health > req.threshold;
    }
  }
}
