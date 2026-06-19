import { describe, expect, it } from "vitest";

import {
  createGame,
  findPlayerCard,
  Team,
  type CardDefinitionId,
  type CardInstanceId,
  type MatchId,
  type Player,
  type PlayerId,
} from "../src";

describe("findPlayerCard", () => {
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

    players: [
      {
        player: playerOne,
        loadout: { cardDefinitionIds: ["card-a" as CardDefinitionId] },
      },
      {
        player: playerTwo,
        loadout: { cardDefinitionIds: [] },
      },
    ],
  });

  it("returns the card when found", () => {
    const card = findPlayerCard(
      state,
      playerOne.id,
      "player-1:1" as CardInstanceId,
    );

    expect(card).toBeDefined();

    expect(card?.instanceId).toBe("player-1:1");

    expect(card?.definitionId).toBe("card-a");
  });

  it("returns undefined when the card does not exist", () => {
    const card = findPlayerCard(
      state,
      playerOne.id,
      "player-1:99" as CardInstanceId,
    );

    expect(card).toBeUndefined();
  });

  it("returns undefined when the player does not exist", () => {
    const card = findPlayerCard(
      state,
      "player-99" as PlayerId,
      "player-1:1" as CardInstanceId,
    );

    expect(card).toBeUndefined();
  });
});
