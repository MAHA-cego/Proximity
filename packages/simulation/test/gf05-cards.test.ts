import { describe, expect, it } from "vitest";

import {
  ActionType,
  createEngine,
  createGame,
  GUARD_ID,
  Guard,
  HEAVY_STRIKE_ID,
  HeavyStrike,
  REGENERATION_ID,
  Regeneration,
  SLASH_ID,
  Slash,
  StatusType,
  Team,
  type CardInstanceId,
  type CombatantDefinition,
  type CombatantId,
  type EndTurnAction,
  type MatchId,
  type UseCardAction,
} from "../src";

const playerOne: CombatantDefinition = {
  id: "player-1" as CombatantId,
  team: Team.One,
  maxHealth: 100,
};

const playerTwo: CombatantDefinition = {
  id: "player-2" as CombatantId,
  team: Team.Two,
  maxHealth: 100,
};

const endTurn = (actorId: CombatantId): EndTurnAction => ({
  type: ActionType.EndTurn,
  actorId,
});

const useCard = (
  actorId: CombatantId,
  cardInstanceId: CardInstanceId,
): UseCardAction => ({
  type: ActionType.UseCard,
  actorId,
  cardInstanceId,
});

describe("Slash", () => {
  const definition = {
    combatants: [
      { combatant: playerOne, loadout: { cardDefinitionIds: [SLASH_ID] } },
      { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
    ],
    cardDefinitions: new Map([[Slash.id, Slash]]),
  };

  it("deals 10 damage to the enemy", () => {
    const engine = createEngine();
    const state = engine.executeAction(
      createGame({ matchId: "m" as MatchId, definition }),
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    expect(state.combatants[1].health).toBe(90);
  });
});

describe("Guard", () => {
  const definition = {
    combatants: [
      { combatant: playerOne, loadout: { cardDefinitionIds: [GUARD_ID] } },
      { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
    ],
    cardDefinitions: new Map([[Guard.id, Guard]]),
  };

  it("applies Shield (duration:1, amount:10) to self", () => {
    const engine = createEngine();
    const state = engine.executeAction(
      createGame({ matchId: "m" as MatchId, definition }),
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    const shield = state.combatants[0].statuses.find(
      (s) => s.type === StatusType.Shield,
    );
    expect(shield).toBeDefined();
    expect(shield?.remainingDuration).toBe(1);
    expect(shield?.amount).toBe(10);
  });

  it("Shield fully absorbs an attack equal to its amount", () => {
    const attackDef = {
      combatants: [
        {
          combatant: { ...playerOne, id: "p1" as CombatantId },
          loadout: { cardDefinitionIds: [GUARD_ID] },
        },
        {
          combatant: { ...playerTwo, id: "p2" as CombatantId },
          loadout: { cardDefinitionIds: [SLASH_ID] },
        },
      ],
      cardDefinitions: new Map([
        [Guard.id, Guard],
        [Slash.id, Slash],
      ]),
    };
    const engine = createEngine();
    let state = createGame({ matchId: "m" as MatchId, definition: attackDef });

    // P1 uses Guard → Shield(1,10) on self
    state = engine.executeAction(
      state,
      useCard("p1" as CombatantId, "p1:1" as CardInstanceId),
      attackDef,
    ).state;
    // P1 EndTurn → P2's turn
    state = engine.executeAction(
      state,
      endTurn("p1" as CombatantId),
      attackDef,
    ).state;
    // P2 uses Slash (10 damage) → fully absorbed by Shield
    state = engine.executeAction(
      state,
      useCard("p2" as CombatantId, "p2:1" as CardInstanceId),
      attackDef,
    ).state;

    expect(state.combatants[0].health).toBe(100);
  });

  it("Shield expires at the start of the next turn", () => {
    const engine = createEngine();
    let state = createGame({ matchId: "m" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;
    // P1 EndTurn → P2 active (Shield still on P1)
    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;
    expect(
      state.combatants[0].statuses.some((s) => s.type === StatusType.Shield),
    ).toBe(true);

    // P2 EndTurn → P1 active. StatusSystem ticks P1's Shield (1→0), removed.
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;
    expect(
      state.combatants[0].statuses.some((s) => s.type === StatusType.Shield),
    ).toBe(false);
  });
});

describe("Heavy Strike", () => {
  const definition = {
    combatants: [
      {
        combatant: playerOne,
        loadout: { cardDefinitionIds: [HEAVY_STRIKE_ID] },
      },
      { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
    ],
    cardDefinitions: new Map([[HeavyStrike.id, HeavyStrike]]),
  };

  it("deals 22 damage to the enemy", () => {
    const engine = createEngine();
    const state = engine.executeAction(
      createGame({ matchId: "m" as MatchId, definition }),
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    expect(state.combatants[1].health).toBe(78);
  });
});

describe("Regeneration", () => {
  const definition = {
    combatants: [
      {
        combatant: { ...playerOne, maxHealth: 100 },
        loadout: { cardDefinitionIds: [REGENERATION_ID] },
      },
      { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
    ],
    cardDefinitions: new Map([[Regeneration.id, Regeneration]]),
  };

  it("applies Regeneration (duration:5, amount:4) to self", () => {
    const engine = createEngine();
    const state = engine.executeAction(
      createGame({ matchId: "m" as MatchId, definition }),
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    const regen = state.combatants[0].statuses.find(
      (s) => s.type === StatusType.Regeneration,
    );
    expect(regen).toBeDefined();
    expect(regen?.remainingDuration).toBe(5);
    expect(regen?.amount).toBe(4);
  });

  it("heals 4 HP at the start of each turn for 5 turns", () => {
    // P2 attacks first (22 damage) → P1 at 78 HP. P1 then uses Regeneration.
    // After 5 cycles: 78 + 5×4 = 98.
    const combatDef = {
      combatants: [
        {
          combatant: { ...playerOne, id: "p1" as CombatantId, maxHealth: 100 },
          loadout: { cardDefinitionIds: [REGENERATION_ID] },
        },
        {
          combatant: { ...playerTwo, id: "p2" as CombatantId },
          loadout: { cardDefinitionIds: [HEAVY_STRIKE_ID] },
        },
      ],
      cardDefinitions: new Map([
        [Regeneration.id, Regeneration],
        [HeavyStrike.id, HeavyStrike],
      ]),
    };
    const engine = createEngine();
    let state = createGame({ matchId: "m" as MatchId, definition: combatDef });

    // P1 passes → P2 attacks (22 damage) → P1 at 78 HP
    state = engine.executeAction(
      state,
      endTurn("p1" as CombatantId),
      combatDef,
    ).state;
    state = engine.executeAction(
      state,
      useCard("p2" as CombatantId, "p2:1" as CardInstanceId),
      combatDef,
    ).state;
    state = engine.executeAction(
      state,
      endTurn("p2" as CombatantId),
      combatDef,
    ).state;
    expect(state.combatants[0].health).toBe(78);

    // P1 uses Regeneration
    state = engine.executeAction(
      state,
      useCard("p1" as CombatantId, "p1:1" as CardInstanceId),
      combatDef,
    ).state;

    // 5 cycles: P1 EndTurn + P2 EndTurn → P1 active, heals 4 each time
    for (let i = 0; i < 5; i++) {
      state = engine.executeAction(
        state,
        endTurn("p1" as CombatantId),
        combatDef,
      ).state;
      state = engine.executeAction(
        state,
        endTurn("p2" as CombatantId),
        combatDef,
      ).state;
    }

    expect(state.combatants[0].health).toBe(98);
  });

  it("Regeneration expires after 5 turns", () => {
    const engine = createEngine();
    let state = createGame({ matchId: "m" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    for (let i = 0; i < 5; i++) {
      state = engine.executeAction(
        state,
        endTurn(playerOne.id),
        definition,
      ).state;
      state = engine.executeAction(
        state,
        endTurn(playerTwo.id),
        definition,
      ).state;
    }

    expect(
      state.combatants[0].statuses.some(
        (s) => s.type === StatusType.Regeneration,
      ),
    ).toBe(false);
  });
});
