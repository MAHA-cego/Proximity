import { describe, expect, it } from "vitest";

import {
  ActionType,
  createEngine,
  createGame,
  Team,
  type CardDefinitionId,
  type CardInstanceId,
  type MatchId,
  type Player,
  type PlayerId,
  type UseCardAction,
} from "../src";

describe("UseCardSystem", () => {
  it("routes UseCardAction without modifying state or emitting events", () => {
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

      definition: {
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
        cardDefinitions: new Map(),
      },
    });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const engine = createEngine();

    const result = engine.executeAction(state, action);

    expect(result.state).toBe(state);

    expect(result.events).toEqual([]);
  });
});
