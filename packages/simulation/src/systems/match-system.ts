import { ActionType } from "../actions";
import type { ExecutionContext } from "../engine/execution-context";
import { IllegalActionError, InvalidStateError } from "../errors";
import { EventType } from "../events";
import { MatchStatus } from "../state";

import type { GameSystem } from "./game-system";

export class MatchSystem implements GameSystem {
  public execute(context: ExecutionContext): void {
    if (context.action.type !== ActionType.Concede) {
      return;
    }

    if (context.state.status !== MatchStatus.InProgress) {
      throw new IllegalActionError("Cannot concede a completed match.");
    }

    const winner = context.state.players.find(
      ({ player }) => player.id !== context.action.actorId,
    );

    if (!winner) {
      throw new InvalidStateError("Unable to determine the winning player.");
    }

    context.replaceState({
      ...context.state,
      status: MatchStatus.Completed,
    });

    context.emit({
      type: EventType.MatchEnded,
      winnerId: winner.player.id,
      loserId: context.action.actorId,
    });
  }
}
