import { describe, expect, it } from "vitest";

import {
  createGame,
  MatchStatus,
  Team,
  type CardDefinitionId,
  type MatchId,
  type Player,
  type PlayerId,
} from "../src";

describe("createGame", () => {
  it("creates a valid initial game state", () => {
    const playerOne: Player = {
      id: "player-1" as PlayerId,
      team: Team.One,
      maxHealth: 30,
    };

    const playerTwo: Player = {
      id: "player-2" as PlayerId,
      team: Team.Two,
      maxHealth: 30,
    };

    const state = createGame({
      matchId: "match-1" as MatchId,

      definition: {
        players: [
          { player: playerOne, loadout: { cardDefinitionIds: [] } },
          { player: playerTwo, loadout: { cardDefinitionIds: [] } },
        ],
        cardDefinitions: new Map(),
      },
    });

    expect(state.metadata.id).toBe("match-1");

    expect(state.players).toHaveLength(2);

    expect(state.players[0].player).toEqual(playerOne);

    expect(state.players[0].cards).toEqual([]);

    expect(state.players[1].player).toEqual(playerTwo);

    expect(state.players[1].cards).toEqual([]);

    expect(state.players[0].health).toBe(30);

    expect(state.players[1].health).toBe(30);

    expect(state.turn.number).toBe(1);

    expect(state.turn.activePlayerId).toBe(playerOne.id);

    expect(state.status).toBe(MatchStatus.InProgress);

    expect(state.sequence).toBe(0);
  });

  it("initializes player cards from loadout", () => {
    const playerOne: Player = {
      id: "player-1" as PlayerId,
      team: Team.One,
      maxHealth: 20,
    };

    const playerTwo: Player = {
      id: "player-2" as PlayerId,
      team: Team.Two,
      maxHealth: 20,
    };

    const state = createGame({
      matchId: "match-1" as MatchId,

      definition: {
        players: [
          {
            player: playerOne,
            loadout: {
              cardDefinitionIds: [
                "card-a" as CardDefinitionId,
                "card-b" as CardDefinitionId,
              ],
            },
          },
          {
            player: playerTwo,
            loadout: { cardDefinitionIds: [] },
          },
        ],
        cardDefinitions: new Map(),
      },
    });

    expect(state.players[0].cards).toHaveLength(2);

    expect(state.players[0].cards[0].instanceId).toBe("player-1:1");

    expect(state.players[0].cards[0].definitionId).toBe("card-a");

    expect(state.players[0].cards[0].remainingCooldown).toBe(0);

    expect(state.players[0].cards[1].instanceId).toBe("player-1:2");

    expect(state.players[0].cards[1].definitionId).toBe("card-b");

    expect(state.players[0].cards[1].remainingCooldown).toBe(0);

    expect(state.players[1].cards).toEqual([]);
  });

  it("requires at least two players", () => {
    const player: Player = {
      id: "player-1" as PlayerId,
      team: Team.One,
      maxHealth: 20,
    };

    expect(() =>
      createGame({
        matchId: "match-1" as MatchId,

        definition: {
          players: [{ player, loadout: { cardDefinitionIds: [] } }],
          cardDefinitions: new Map(),
        },
      }),
    ).toThrow();
  });
});
