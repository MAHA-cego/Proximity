import { describe, expect, it } from "vitest";

import {
  ActionType,
  createEngine,
  createGame,
  EventType,
  Team,
  type EndTurnAction,
  type MatchId,
  type Player,
  type PlayerId,
} from "../src";

describe("Engine", () => {
  it("advances the turn", () => {
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
          { player: playerOne, loadout: { cardDefinitionIds: [] } },
          { player: playerTwo, loadout: { cardDefinitionIds: [] } },
        ],
        cardDefinitions: new Map(),
      },
    });

    const action: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne.id,
    };

    const engine = createEngine();

    const result = engine.executeAction(state, action);

    expect(result.state.turn.number).toBe(2);

    expect(result.state.turn.activePlayerId).toBe(playerTwo.id);

    expect(result.events).toEqual([
      {
        type: EventType.TurnEnded,
        playerId: playerOne.id,
      },
    ]);

    expect(state.turn.number).toBe(1);
    expect(state.turn.activePlayerId).toBe(playerOne.id);
  });
});
