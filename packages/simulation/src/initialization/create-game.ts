import {
  type CardInstanceId,
  type MatchId,
  type Player,
  type PlayerLoadout,
} from "../core";

import {
  MatchStatus,
  type GameState,
  type PlayerCardState,
  type PlayerState,
} from "../state";

export interface CreateGamePlayer {
  readonly player: Player;

  readonly loadout: PlayerLoadout;
}

export interface CreateGameOptions {
  readonly matchId: MatchId;

  readonly players: readonly CreateGamePlayer[];
}

const INITIAL_PLAYER_HEALTH = 20;

export function createGame(options: CreateGameOptions): GameState {
  if (options.players.length < 2) {
    throw new Error("A game requires at least two players.");
  }

  const players: PlayerState[] = options.players.map(({ player, loadout }) => {
    const cards: PlayerCardState[] = loadout.cardDefinitionIds.map(
      (definitionId, index) => ({
        instanceId: `${player.id}:${index + 1}` as CardInstanceId,
        definitionId,
      }),
    );

    return {
      player,
      health: INITIAL_PLAYER_HEALTH,
      cards,
    };
  });

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
