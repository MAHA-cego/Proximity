import { describe, expect, it } from "vitest";

import {
  createGame,
  MatchStatus,
  Team,
  type CardDefinitionId,
  type CombatantDefinition,
  type CombatantId,
  type MatchId,
} from "../src";

describe("createGame", () => {
  it("creates a valid initial game state", () => {
    const playerOne: CombatantDefinition = {
      id: "player-1" as CombatantId,
      team: Team.One,
      maxHealth: 30,
    };

    const playerTwo: CombatantDefinition = {
      id: "player-2" as CombatantId,
      team: Team.Two,
      maxHealth: 30,
    };

    const state = createGame({
      matchId: "match-1" as MatchId,

      definition: {
        combatants: [
          { combatant: playerOne, loadout: { cardDefinitionIds: [] } },
          { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
        ],
        cardDefinitions: new Map(),
      },
    });

    expect(state.metadata.id).toBe("match-1");

    expect(state.combatants).toHaveLength(2);

    expect(state.combatants[0].combatant).toEqual(playerOne);

    expect(state.combatants[0].cards).toEqual([]);

    expect(state.combatants[1].combatant).toEqual(playerTwo);

    expect(state.combatants[1].cards).toEqual([]);

    expect(state.combatants[0].health).toBe(30);

    expect(state.combatants[1].health).toBe(30);

    expect(state.turn.number).toBe(1);

    expect(state.turn.activeCombatantId).toBe(playerOne.id);

    expect(state.status).toBe(MatchStatus.InProgress);

    expect(state.sequence).toBe(0);
  });

  it("initializes player cards from loadout", () => {
    const playerOne: CombatantDefinition = {
      id: "player-1" as CombatantId,
      team: Team.One,
      maxHealth: 20,
    };

    const playerTwo: CombatantDefinition = {
      id: "player-2" as CombatantId,
      team: Team.Two,
      maxHealth: 20,
    };

    const state = createGame({
      matchId: "match-1" as MatchId,

      definition: {
        combatants: [
          {
            combatant: playerOne,
            loadout: {
              cardDefinitionIds: [
                "card-a" as CardDefinitionId,
                "card-b" as CardDefinitionId,
              ],
            },
          },
          {
            combatant: playerTwo,
            loadout: { cardDefinitionIds: [] },
          },
        ],
        cardDefinitions: new Map(),
      },
    });

    expect(state.combatants[0].cards).toHaveLength(2);

    expect(state.combatants[0].cards[0].instanceId).toBe("player-1:1");

    expect(state.combatants[0].cards[0].definitionId).toBe("card-a");

    expect(state.combatants[0].cards[0].remainingCooldown).toBe(0);

    expect(state.combatants[0].cards[1].instanceId).toBe("player-1:2");

    expect(state.combatants[0].cards[1].definitionId).toBe("card-b");

    expect(state.combatants[0].cards[1].remainingCooldown).toBe(0);

    expect(state.combatants[1].cards).toEqual([]);
  });

  it("requires at least two combatants", () => {
    const combatant: CombatantDefinition = {
      id: "player-1" as CombatantId,
      team: Team.One,
      maxHealth: 20,
    };

    expect(() =>
      createGame({
        matchId: "match-1" as MatchId,

        definition: {
          combatants: [{ combatant, loadout: { cardDefinitionIds: [] } }],
          cardDefinitions: new Map(),
        },
      }),
    ).toThrow();
  });
});
