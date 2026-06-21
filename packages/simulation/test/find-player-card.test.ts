import { describe, expect, it } from "vitest";

import {
  createGame,
  findCombatantCard,
  Team,
  type CardDefinitionId,
  type CardInstanceId,
  type CombatantDefinition,
  type CombatantId,
  type MatchId,
} from "../src";

describe("findCombatantCard", () => {
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
          loadout: { cardDefinitionIds: ["card-a" as CardDefinitionId] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [] },
        },
      ],
      cardDefinitions: new Map(),
    },
  });

  it("returns the card when found", () => {
    const card = findCombatantCard(
      state,
      playerOne.id,
      "player-1:1" as CardInstanceId,
    );

    expect(card).toBeDefined();

    expect(card?.instanceId).toBe("player-1:1");

    expect(card?.definitionId).toBe("card-a");

    expect(card?.remainingCooldown).toBe(0);
  });

  it("returns undefined when the card does not exist", () => {
    const card = findCombatantCard(
      state,
      playerOne.id,
      "player-1:99" as CardInstanceId,
    );

    expect(card).toBeUndefined();
  });

  it("returns undefined when the combatant does not exist", () => {
    const card = findCombatantCard(
      state,
      "player-99" as CombatantId,
      "player-1:1" as CardInstanceId,
    );

    expect(card).toBeUndefined();
  });
});
