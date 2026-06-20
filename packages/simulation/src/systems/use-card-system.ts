import { ActionType } from "../actions";
import { AbilityTrigger } from "../core";
import { resolveEffects } from "../effects";
import { IllegalActionError } from "../errors";
import type { ExecutionContext } from "../engine/execution-context";

import type { GameSystem } from "./game-system";

export class UseCardSystem implements GameSystem {
  public execute(context: ExecutionContext): void {
    const { action } = context;

    if (action.type !== ActionType.UseCard) {
      return;
    }

    const { state } = context;

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

    if (!cardExists) {
      throw IllegalActionError.cardNotFound();
    }

    if (!cardOwned) {
      throw IllegalActionError.cardNotOwned();
    }

    const playerIndex = state.players.findIndex(
      (ps) => ps.player.id === action.actorId,
    );

    const playerState = state.players[playerIndex];

    const cardIndex = playerState.cards.findIndex(
      (c) => c.instanceId === action.cardInstanceId,
    );

    const card = playerState.cards[cardIndex];

    if (card.remainingCooldown > 0) {
      throw IllegalActionError.cardOnCooldown();
    }

    const cardDefinition = context.definition.cardDefinitions.get(
      card.definitionId,
    )!;

    const updatedCards = [
      ...playerState.cards.slice(0, cardIndex),
      { ...card, remainingCooldown: cardDefinition.cooldown },
      ...playerState.cards.slice(cardIndex + 1),
    ];

    const updatedPlayers = [
      ...state.players.slice(0, playerIndex),
      { ...playerState, cards: updatedCards },
      ...state.players.slice(playerIndex + 1),
    ];

    context.replaceState({ ...state, players: updatedPlayers });

    for (const ability of cardDefinition.abilities) {
      if (ability.trigger === AbilityTrigger.OnUse) {
        resolveEffects(context, ability);
      }
    }
  }
}
