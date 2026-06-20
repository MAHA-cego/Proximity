import { describe, expect, it } from "vitest";

import {
  ActionType,
  createEngine,
  createGame,
  Execute,
  EXECUTE_ID,
  Team,
  type CardInstanceId,
  type MatchId,
  type Player,
  type PlayerId,
  type UseCardAction,
} from "../src";

const playerOne: Player = {
  id: "player-1" as PlayerId,
  team: Team.One,
  maxHealth: 20,
};

const action: UseCardAction = {
  type: ActionType.UseCard,
  actorId: playerOne.id,
  cardInstanceId: "player-1:1" as CardInstanceId,
};

describe("Execute", () => {
  it("fires when enemy health is below threshold", () => {
    const lowHealthEnemy: Player = {
      id: "player-2" as PlayerId,
      team: Team.Two,
      maxHealth: 4,
    };

    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [EXECUTE_ID] } },
        { player: lowHealthEnemy, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[EXECUTE_ID, Execute]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[1].health).toBe(-16);
  });

  it("is blocked when enemy health equals threshold", () => {
    const enemyAtThreshold: Player = {
      id: "player-2" as PlayerId,
      team: Team.Two,
      maxHealth: 5,
    };

    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [EXECUTE_ID] } },
        { player: enemyAtThreshold, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[EXECUTE_ID, Execute]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();
  });

  it("is blocked when enemy health is above threshold", () => {
    const healthyEnemy: Player = {
      id: "player-2" as PlayerId,
      team: Team.Two,
      maxHealth: 20,
    };

    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [EXECUTE_ID] } },
        { player: healthyEnemy, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[EXECUTE_ID, Execute]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();
  });

  it("evaluates enemy health independently of actor health", () => {
    const lowHealthActor: Player = {
      id: "player-1" as PlayerId,
      team: Team.One,
      maxHealth: 3,
    };

    const healthyEnemy: Player = {
      id: "player-2" as PlayerId,
      team: Team.Two,
      maxHealth: 20,
    };

    const definition = {
      players: [
        {
          player: lowHealthActor,
          loadout: { cardDefinitionIds: [EXECUTE_ID] },
        },
        { player: healthyEnemy, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[EXECUTE_ID, Execute]]),
    };

    const actorAction: UseCardAction = {
      type: ActionType.UseCard,
      actorId: lowHealthActor.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(() =>
      createEngine().executeAction(state, actorAction, definition),
    ).toThrow();
  });
});
