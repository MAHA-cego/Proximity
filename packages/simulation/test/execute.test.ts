import { describe, expect, it } from "vitest";

import {
  ActionType,
  createEngine,
  createGame,
  Execute,
  EXECUTE_ID,
  Team,
  type CardInstanceId,
  type CombatantDefinition,
  type CombatantId,
  type MatchId,
  type UseCardAction,
} from "../src";

const playerOne: CombatantDefinition = {
  id: "player-1" as CombatantId,
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
    const lowHealthEnemy: CombatantDefinition = {
      id: "player-2" as CombatantId,
      team: Team.Two,
      maxHealth: 4,
    };

    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [EXECUTE_ID] } },
        { combatant: lowHealthEnemy, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[EXECUTE_ID, Execute]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.combatants[1].health).toBe(-16);
  });

  it("is blocked when enemy health equals threshold", () => {
    const enemyAtThreshold: CombatantDefinition = {
      id: "player-2" as CombatantId,
      team: Team.Two,
      maxHealth: 5,
    };

    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [EXECUTE_ID] } },
        { combatant: enemyAtThreshold, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[EXECUTE_ID, Execute]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();
  });

  it("is blocked when enemy health is above threshold", () => {
    const healthyEnemy: CombatantDefinition = {
      id: "player-2" as CombatantId,
      team: Team.Two,
      maxHealth: 20,
    };

    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [EXECUTE_ID] } },
        { combatant: healthyEnemy, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[EXECUTE_ID, Execute]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();
  });

  it("evaluates enemy health independently of actor health", () => {
    const lowHealthActor: CombatantDefinition = {
      id: "player-1" as CombatantId,
      team: Team.One,
      maxHealth: 3,
    };

    const healthyEnemy: CombatantDefinition = {
      id: "player-2" as CombatantId,
      team: Team.Two,
      maxHealth: 20,
    };

    const definition = {
      combatants: [
        {
          combatant: lowHealthActor,
          loadout: { cardDefinitionIds: [EXECUTE_ID] },
        },
        { combatant: healthyEnemy, loadout: { cardDefinitionIds: [] } },
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
