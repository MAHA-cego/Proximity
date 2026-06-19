import { ActionType } from "../actions";
import type { ExecutionContext } from "../engine/execution-context";

import type { GameSystem } from "./game-system";

export class CooldownSystem implements GameSystem {
  public execute(context: ExecutionContext): void {
    if (context.action.type !== ActionType.EndTurn) {
      return;
    }

    const activePlayerId = context.state.turn.activePlayerId;

    const playerIndex = context.state.players.findIndex(
      (ps) => ps.player.id === activePlayerId,
    );

    const playerState = context.state.players[playerIndex];

    const updatedCards = playerState.cards.map((card) => ({
      ...card,
      remainingCooldown: Math.max(0, card.remainingCooldown - 1),
    }));

    const updatedPlayers = [
      ...context.state.players.slice(0, playerIndex),
      { ...playerState, cards: updatedCards },
      ...context.state.players.slice(playerIndex + 1),
    ];

    context.replaceState({
      ...context.state,
      players: updatedPlayers,
    });
  }
}
