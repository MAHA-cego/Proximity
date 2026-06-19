import { describe, expect, it } from "vitest";

import {
  createGame,
  MatchStatus,
  Team,
  type MatchId,
  type Player,
  type PlayerId,
} from "../src";

describe("createGame", () => {
  it("creates a valid initial game state", () => {
    const playerOne: Player = {
      id: "player-1" as PlayerId,
      team: Team.One,
    };

    const playerTwo: Player = {
      id: "player-2" as PlayerId,
      team: Team.Two,
    };

    const state = createGame({
      matchId: "match-1" as MatchId,

      players: [playerOne, playerTwo],
    });

    expect(state.metadata.id).toBe("match-1");

    expect(state.players).toHaveLength(2);

    expect(state.players[0].player).toEqual(playerOne);

    expect(state.players[0].cards).toEqual([]);

    expect(state.players[1].player).toEqual(playerTwo);

    expect(state.players[1].cards).toEqual([]);

    expect(state.turn.number).toBe(1);

    expect(state.turn.activePlayerId).toBe(playerOne.id);

    expect(state.status).toBe(MatchStatus.InProgress);

    expect(state.sequence).toBe(0);
  });

  it("requires at least two players", () => {
    const player: Player = {
      id: "player-1" as PlayerId,
      team: Team.One,
    };

    expect(() =>
      createGame({
        matchId: "match-1" as MatchId,

        players: [player],
      }),
    ).toThrow();
  });
});
