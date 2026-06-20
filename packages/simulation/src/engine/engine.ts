import { ActionType } from "../actions";
import { AbilityTrigger, type MatchDefinition, type MatchId } from "../core";
import { dispatchTrigger } from "../effects";
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
}
