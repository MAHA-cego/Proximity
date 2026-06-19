import { ActionType } from "../actions";
import type { ExecutionContext } from "../engine/execution-context";
import { IllegalActionError, InvalidStateError } from "../errors";
import { EventType } from "../events";
import { MatchStatus } from "../state";

import type { GameSystem } from "./game-system";

export class TurnSystem implements GameSystem {
  public execute(context: ExecutionContext): void {
    if (context.action.type !== ActionType.EndTurn) {
      return;
    }

    if (context.state.status !== MatchStatus.InProgress) {
      throw IllegalActionError.matchCompleted();
    }

    if (context.action.actorId !== context.state.turn.activePlayerId) {
      throw IllegalActionError.notActivePlayer();
    }

    const currentPlayerIndex = context.state.players.findIndex(
      ({ player }) => player.id === context.state.turn.activePlayerId,
    );

    if (currentPlayerIndex === -1) {
      throw InvalidStateError.activePlayerMissing();
    }

    const nextPlayerIndex =
      (currentPlayerIndex + 1) % context.state.players.length;

    const nextPlayer = context.state.players[nextPlayerIndex];

    context.replaceState({
      ...context.state,
      turn: {
        number: context.state.turn.number + 1,
        activePlayerId: nextPlayer.player.id,
      },
    });

    context.emit({
      type: EventType.TurnEnded,
      playerId: context.action.actorId,
    });
  }
}
