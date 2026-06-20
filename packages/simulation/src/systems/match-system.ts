import { ActionType } from "../actions";
import type { ExecutionContext } from "../engine/execution-context";
import { IllegalActionError, InvalidStateError } from "../errors";
import { EventType } from "../events";
import { MatchStatus } from "../state";

import type { GameSystem } from "./game-system";

export class MatchSystem implements GameSystem {
  public execute(context: ExecutionContext): void {
    if (context.state.status !== MatchStatus.InProgress) {
      return;
    }

    if (context.action.type === ActionType.Concede) {
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

      return;
    }

    const defeated = context.state.players.find((ps) => ps.health <= 0);

    if (!defeated) {
      return;
    }

    const winner = context.state.players.find((ps) => ps.health > 0);

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
      loserId: defeated.player.id,
    });
  }
}
