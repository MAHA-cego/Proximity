import { type MatchId, type Player } from "../core";

import { MatchStatus, type GameState, type PlayerState } from "../state";

export interface CreateGameOptions {
  readonly matchId: MatchId;

  readonly players: readonly Player[];
}

const INITIAL_PLAYER_HEALTH = 20;

export function createGame(options: CreateGameOptions): GameState {
  if (options.players.length < 2) {
    throw new Error("A game requires at least two players.");
  }

  const players: PlayerState[] = options.players.map((player) => ({
    player,
    health: INITIAL_PLAYER_HEALTH,
  }));

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
