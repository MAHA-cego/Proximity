import { describe, expect, it } from "vitest";

import {
  ActionType,
  createEngine,
  EventType,
  MatchStatus,
  Team,
  type EndTurnAction,
  type GameState,
  type MatchId,
  type PlayerId,
} from "../src";

describe("Engine", () => {
  it("advances the turn", () => {
    const playerOne = "player-1" as PlayerId;
    const playerTwo = "player-2" as PlayerId;
    const matchId = "match-1" as MatchId;

    const state: GameState = {
      metadata: {
        id: matchId,
      },

      players: [
        {
          player: {
            id: playerOne,
            team: Team.One,
          },
          health: 20,
        },
        {
          player: {
            id: playerTwo,
            team: Team.Two,
          },
          health: 20,
        },
      ],

      turn: {
        number: 1,
        activePlayerId: playerOne,
      },

      status: MatchStatus.InProgress,

      sequence: 0,
    };

    const action: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne,
    };

    const engine = createEngine();

    const result = engine.executeAction(state, action);

    expect(result.state.turn.number).toBe(2);

    expect(result.state.turn.activePlayerId).toBe(playerTwo);

    expect(result.events).toEqual([
      {
        type: EventType.TurnEnded,
        playerId: playerOne,
      },
    ]);

    expect(state.turn.number).toBe(1);
    expect(state.turn.activePlayerId).toBe(playerOne);
  });
});
