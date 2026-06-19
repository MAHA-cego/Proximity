import { ActionType } from "../actions";
import type { ExecutionContext } from "../engine/execution-context";

import type { GameSystem } from "./game-system";

export class UseCardSystem implements GameSystem {
  public execute(context: ExecutionContext): void {
    const { action } = context;

    if (action.type !== ActionType.UseCard) {
      return;
    }

    const playerIndex = context.state.players.findIndex(
      (ps) => ps.player.id === action.actorId,
    );

    const playerState = context.state.players[playerIndex];

    const cardIndex = playerState.cards.findIndex(
      (c) => c.instanceId === action.cardInstanceId,
    );

    const card = playerState.cards[cardIndex];

    const cardDefinition = context.definition.cardDefinitions.get(
      card.definitionId,
    )!;

    const updatedCards = [
      ...playerState.cards.slice(0, cardIndex),
      { ...card, remainingCooldown: cardDefinition.cooldown },
      ...playerState.cards.slice(cardIndex + 1),
    ];

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
