import { describe, expect, it } from "vitest";

import {
  ActionType,
  createEngine,
  createGame,
  EventType,
  MatchStatus,
  Team,
  type ConcedeAction,
  type MatchId,
  type Player,
  type PlayerId,
} from "../src";

describe("MatchSystem", () => {
  it("ends the match when a player concedes", () => {
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

    const action: ConcedeAction = {
      type: ActionType.Concede,
      actorId: playerOne.id,
    };

    const engine = createEngine();

    const result = engine.executeAction(state, action);

    expect(result.state.status).toBe(MatchStatus.Completed);

    expect(result.events).toEqual([
      {
        type: EventType.MatchEnded,
        winnerId: playerTwo.id,
        loserId: playerOne.id,
      },
    ]);

    expect(state.status).toBe(MatchStatus.InProgress);
  });
});
