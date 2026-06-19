import {
  type CardInstanceId,
  type MatchDefinition,
  type MatchId,
} from "../core";

import {
  MatchStatus,
  type GameState,
  type PlayerCardState,
  type PlayerState,
} from "../state";

export interface CreateGameOptions {
  readonly matchId: MatchId;

  readonly definition: MatchDefinition;
}

const INITIAL_PLAYER_HEALTH = 20;

export function createGame(options: CreateGameOptions): GameState {
  if (options.definition.players.length < 2) {
    throw new Error("A game requires at least two players.");
  }

  const players: PlayerState[] = options.definition.players.map(
    ({ player, loadout }) => {
      const cards: PlayerCardState[] = loadout.cardDefinitionIds.map(
        (definitionId, index) => ({
          instanceId: `${player.id}:${index + 1}` as CardInstanceId,
          definitionId,
          remainingCooldown: 0,
        }),
      );

      return {
        player,
        health: INITIAL_PLAYER_HEALTH,
        cards,
      };
    },
  );

  return {
    metadata: {
      id: options.matchId,
    },

    players,

    turn: {
      number: 1,
      activePlayerId: players[0].player.id,
    },

    status: MatchStatus.InProgress,

    sequence: 0,
  };
}
