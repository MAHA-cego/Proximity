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
      const winner = context.state.combatants.find(
        ({ combatant }) => combatant.id !== context.action.actorId,
      );

      if (!winner) {
        throw InvalidStateError.winnerNotFound();
      }

      context.replaceState({
        ...context.state,
        status: MatchStatus.Completed,
      });

      context.emit({
        type: EventType.PlayerConceded,
        combatantId: context.action.actorId,
      });

      context.emit({
        type: EventType.MatchEnded,
        winnerId: winner.combatant.id,
        loserId: context.action.actorId,
      });

      return;
    }

    const defeated = context.state.combatants.find((cs) => cs.health <= 0);

    if (!defeated) {
      return;
    }

    const winner = context.state.combatants.find((cs) => cs.health > 0);

    if (!winner) {
      throw InvalidStateError.winnerNotFound();
    }

    context.replaceState({
      ...context.state,
      status: MatchStatus.Completed,
    });

    context.emit({
      type: EventType.CombatantDefeated,
      combatantId: defeated.combatant.id,
    });

    context.emit({
      type: EventType.MatchEnded,
      winnerId: winner.combatant.id,
      loserId: defeated.combatant.id,
    });
  }
}
