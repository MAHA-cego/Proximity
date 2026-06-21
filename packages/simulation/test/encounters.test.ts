import { describe, expect, it } from "vitest";

import {
  CORRUPTED_HUNTER_CARD_DEFINITIONS,
  CORRUPTED_HUNTER_ID,
  CORRUPTED_HUNTER_UNLOCK_REWARDS,
  CorruptedHunter,
  CorruptedHunterLoadout,
  CorruptedHunterMatchCombatant,
  CORRUPTED_MILITIAMAN_CARD_DEFINITIONS,
  CORRUPTED_MILITIAMAN_ID,
  CORRUPTED_MILITIAMAN_UNLOCK_REWARDS,
  CorruptedMilitiaman,
  CorruptedMilitiamanLoadout,
  CorruptedMilitiamanMatchCombatant,
  CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS,
  CORRUPTED_SHEPHERDS_DOG_ID,
  CORRUPTED_SHEPHERDS_DOG_UNLOCK_REWARDS,
  CorruptedShepherdsDog,
  CorruptedShepherdsDogLoadout,
  CorruptedShepherdsDogMatchCombatant,
  createGame,
  Team,
  type CombatantId,
  type MatchCombatant,
  type MatchId,
} from "../src";

const PLAYER_ID = "player" as CombatantId;

const playerCombatant: MatchCombatant = {
  combatant: { id: PLAYER_ID, team: Team.One, maxHealth: 100 },
  loadout: { cardDefinitionIds: [] },
};

describe("Corrupted Shepherd's Dog", () => {
  it("has correct health", () => {
    expect(CorruptedShepherdsDog.maxHealth).toBe(90);
  });

  it("has exactly six cards in its loadout", () => {
    expect(CorruptedShepherdsDogLoadout.cardDefinitionIds).toHaveLength(6);
  });

  it("is assigned to Team Two", () => {
    expect(CorruptedShepherdsDog.team).toBe(Team.Two);
  });

  it("every card in the loadout has a definition", () => {
    for (const id of CorruptedShepherdsDogLoadout.cardDefinitionIds) {
      expect(CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS.has(id)).toBe(true);
    }
  });

  it("every unlock reward has a definition", () => {
    for (const id of CORRUPTED_SHEPHERDS_DOG_UNLOCK_REWARDS) {
      expect(CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS.has(id)).toBe(true);
    }
  });

  it("unlock rewards are exactly Parry and Berserk", () => {
    expect(CORRUPTED_SHEPHERDS_DOG_UNLOCK_REWARDS).toContain("parry");
    expect(CORRUPTED_SHEPHERDS_DOG_UNLOCK_REWARDS).toContain("berserk");
    expect(CORRUPTED_SHEPHERDS_DOG_UNLOCK_REWARDS).toHaveLength(2);
  });

  it("produces a valid deterministic match definition", () => {
    const definition = {
      combatants: [playerCombatant, CorruptedShepherdsDogMatchCombatant],
      cardDefinitions: CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS,
    };

    const stateA = createGame({ matchId: "m" as MatchId, definition });
    const stateB = createGame({ matchId: "m" as MatchId, definition });

    expect(stateA).toStrictEqual(stateB);
    expect(stateA.combatants[1].combatant.id).toBe(CORRUPTED_SHEPHERDS_DOG_ID);
    expect(stateA.combatants[1].health).toBe(90);
    expect(stateA.combatants[1].cards).toHaveLength(6);
  });
});

describe("Corrupted Hunter", () => {
  it("has correct health", () => {
    expect(CorruptedHunter.maxHealth).toBe(100);
  });

  it("has exactly six cards in its loadout", () => {
    expect(CorruptedHunterLoadout.cardDefinitionIds).toHaveLength(6);
  });

  it("is assigned to Team Two", () => {
    expect(CorruptedHunter.team).toBe(Team.Two);
  });

  it("every card in the loadout has a definition", () => {
    for (const id of CorruptedHunterLoadout.cardDefinitionIds) {
      expect(CORRUPTED_HUNTER_CARD_DEFINITIONS.has(id)).toBe(true);
    }
  });

  it("every unlock reward has a definition", () => {
    for (const id of CORRUPTED_HUNTER_UNLOCK_REWARDS) {
      expect(CORRUPTED_HUNTER_CARD_DEFINITIONS.has(id)).toBe(true);
    }
  });

  it("unlock rewards are exactly Preparation and Regeneration", () => {
    expect(CORRUPTED_HUNTER_UNLOCK_REWARDS).toContain("preparation");
    expect(CORRUPTED_HUNTER_UNLOCK_REWARDS).toContain("regeneration");
    expect(CORRUPTED_HUNTER_UNLOCK_REWARDS).toHaveLength(2);
  });

  it("produces a valid deterministic match definition", () => {
    const definition = {
      combatants: [playerCombatant, CorruptedHunterMatchCombatant],
      cardDefinitions: CORRUPTED_HUNTER_CARD_DEFINITIONS,
    };

    const stateA = createGame({ matchId: "m" as MatchId, definition });
    const stateB = createGame({ matchId: "m" as MatchId, definition });

    expect(stateA).toStrictEqual(stateB);
    expect(stateA.combatants[1].combatant.id).toBe(CORRUPTED_HUNTER_ID);
    expect(stateA.combatants[1].health).toBe(100);
    expect(stateA.combatants[1].cards).toHaveLength(6);
  });
});

describe("Corrupted Militiaman", () => {
  it("has correct health", () => {
    expect(CorruptedMilitiaman.maxHealth).toBe(110);
  });

  it("has exactly six cards in its loadout", () => {
    expect(CorruptedMilitiamanLoadout.cardDefinitionIds).toHaveLength(6);
  });

  it("is assigned to Team Two", () => {
    expect(CorruptedMilitiaman.team).toBe(Team.Two);
  });

  it("every card in the loadout has a definition", () => {
    for (const id of CorruptedMilitiamanLoadout.cardDefinitionIds) {
      expect(CORRUPTED_MILITIAMAN_CARD_DEFINITIONS.has(id)).toBe(true);
    }
  });

  it("every unlock reward has a definition", () => {
    for (const id of CORRUPTED_MILITIAMAN_UNLOCK_REWARDS) {
      expect(CORRUPTED_MILITIAMAN_CARD_DEFINITIONS.has(id)).toBe(true);
    }
  });

  it("unlock rewards are exactly Feint and Exploit", () => {
    expect(CORRUPTED_MILITIAMAN_UNLOCK_REWARDS).toContain("feint");
    expect(CORRUPTED_MILITIAMAN_UNLOCK_REWARDS).toContain("exploit");
    expect(CORRUPTED_MILITIAMAN_UNLOCK_REWARDS).toHaveLength(2);
  });

  it("produces a valid deterministic match definition", () => {
    const definition = {
      combatants: [playerCombatant, CorruptedMilitiamanMatchCombatant],
      cardDefinitions: CORRUPTED_MILITIAMAN_CARD_DEFINITIONS,
    };

    const stateA = createGame({ matchId: "m" as MatchId, definition });
    const stateB = createGame({ matchId: "m" as MatchId, definition });

    expect(stateA).toStrictEqual(stateB);
    expect(stateA.combatants[1].combatant.id).toBe(CORRUPTED_MILITIAMAN_ID);
    expect(stateA.combatants[1].health).toBe(110);
    expect(stateA.combatants[1].cards).toHaveLength(6);
  });
});
