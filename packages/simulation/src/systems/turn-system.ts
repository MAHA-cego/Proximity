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

    if (context.action.actorId !== context.state.turn.activeCombatantId) {
      throw IllegalActionError.notActivePlayer();
    }

    const currentCombatantIndex = context.state.combatants.findIndex(
      ({ combatant }) => combatant.id === context.state.turn.activeCombatantId,
    );

    if (currentCombatantIndex === -1) {
      throw InvalidStateError.activePlayerMissing();
    }

    const nextCombatantIndex =
      (currentCombatantIndex + 1) % context.state.combatants.length;

    const nextCombatant = context.state.combatants[nextCombatantIndex];

    context.replaceState({
      ...context.state,
      turn: {
        number: context.state.turn.number + 1,
        activeCombatantId: nextCombatant.combatant.id,
      },
    });

    context.emit({
      type: EventType.TurnEnded,
      combatantId: context.action.actorId,
    });
  }
}
