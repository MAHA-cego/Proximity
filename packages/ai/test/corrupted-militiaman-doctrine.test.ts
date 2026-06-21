import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  CORRUPTED_MILITIAMAN_CARD_DEFINITIONS,
  CORRUPTED_MILITIAMAN_ID,
  CorruptedMilitiaman,
  CorruptedMilitiamanLoadout,
  createEngine,
  createGame,
  EffectType,
  EXPLOIT_ID,
  FEINT_ID,
  GUARD_ID,
  MatchStatus,
  StatusType,
  TargetingType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type CombatantDefinition,
  type CombatantId,
  type MatchId,
} from "@proximity/simulation";

import { createBasicHeuristicAi, createCorruptedMilitiamanAi } from "../src";

const PLAYER_ID = "player" as CombatantId;

const player: CombatantDefinition = {
  id: PLAYER_ID,
  team: Team.One,
  maxHealth: 200,
};

const playerStrike: CardDefinition = {
  id: "player-strike" as CardDefinitionId,
  cooldown: 1,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [{ type: EffectType.Damage, amount: 15 }],
    },
  ],
};

const standardDef = {
  combatants: [
    {
      combatant: player,
      loadout: { cardDefinitionIds: [playerStrike.id] },
    },
    {
      combatant: CorruptedMilitiaman,
      loadout: CorruptedMilitiamanLoadout,
    },
  ],
  cardDefinitions: new Map([
    [playerStrike.id, playerStrike],
    ...CORRUPTED_MILITIAMAN_CARD_DEFINITIONS,
  ]),
};

const endTurnPlayer = { type: ActionType.EndTurn as const, actorId: PLAYER_ID };
const endTurnMilitiaman = {
  type: ActionType.EndTurn as const,
  actorId: CORRUPTED_MILITIAMAN_ID,
};

describe("Corrupted Militiaman doctrine — determinism", () => {
  it("produces the same action from the same state", () => {
    const ai = createCorruptedMilitiamanAi();
    const engine = createEngine();
    const state = engine.executeAction(
      createGame({ matchId: "m" as MatchId, definition: standardDef }),
      endTurnPlayer,
      standardDef,
    ).state;

    expect(ai.selectAction(state, standardDef)).toStrictEqual(
      ai.selectAction(state, standardDef),
    );
  });

  it("produces identical results when replaying from the same initial state", () => {
    const run = () => {
      const ai = createCorruptedMilitiamanAi();
      const playerAi = createBasicHeuristicAi();
      const engine = createEngine();
      let state = createGame({
        matchId: "m" as MatchId,
        definition: standardDef,
      });
      let i = 0;
      while (state.status === MatchStatus.InProgress && i < 200) {
        const isPlayerTurn = state.turn.activeCombatantId === PLAYER_ID;
        const action = isPlayerTurn
          ? playerAi.selectAction(state, standardDef)
          : ai.selectAction(state, standardDef);
        state = engine.executeAction(state, action, standardDef).state;
        i++;
      }
      return state;
    };

    expect(run()).toStrictEqual(run());
  });
});

describe("Corrupted Militiaman doctrine — opening preference", () => {
  it("opens with Guard on the first available turn", () => {
    const ai = createCorruptedMilitiamanAi();
    const engine = createEngine();
    // turn 1 → endTurnPlayer → turn 2 (Militiaman, turnNumber<=2 → Guard first)
    const state = engine.executeAction(
      createGame({ matchId: "m" as MatchId, definition: standardDef }),
      endTurnPlayer,
      standardDef,
    ).state;

    const action = ai.selectAction(state, standardDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const militiaman = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_MILITIAMAN_ID,
      )!;
      expect(
        militiaman.cards.find((c) => c.instanceId === action.cardInstanceId)!
          .definitionId,
      ).toBe(GUARD_ID);
    }
  });
});

describe("Corrupted Militiaman doctrine — Feint behaviour", () => {
  it("selects Feint when the enemy health drops below the threshold", () => {
    // player.maxHealth=20; threshold is 60% of 20 = 12.
    // After one Slash (10 dmg), player is at 10 HP ≤ 12 → feint opportunity.
    // Turn schedule: 2 Guard, 4 Slash → player 10 HP, 6 AI → should pick Feint.
    const feintDef = {
      combatants: [
        {
          combatant: { ...player, maxHealth: 20 },
          loadout: { cardDefinitionIds: [] },
        },
        { combatant: CorruptedMilitiaman, loadout: CorruptedMilitiamanLoadout },
      ],
      cardDefinitions: new Map([...CORRUPTED_MILITIAMAN_CARD_DEFINITIONS]),
    };

    const engine = createEngine();
    const ai = createCorruptedMilitiamanAi();
    let state = createGame({ matchId: "m" as MatchId, definition: feintDef });

    // turn 2: Militiaman Guard (manually)
    state = engine.executeAction(state, endTurnPlayer, feintDef).state;
    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: CORRUPTED_MILITIAMAN_ID,
        cardInstanceId: "corrupted-militiaman:2" as CardInstanceId, // Guard, slot 2
      },
      feintDef,
    ).state;
    state = engine.executeAction(state, endTurnMilitiaman, feintDef).state;

    // turn 4: Militiaman Slash → player 20-10=10 HP
    state = engine.executeAction(state, endTurnPlayer, feintDef).state;
    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: CORRUPTED_MILITIAMAN_ID,
        cardInstanceId: "corrupted-militiaman:1" as CardInstanceId, // Slash, slot 1
      },
      feintDef,
    ).state;
    state = engine.executeAction(state, endTurnMilitiaman, feintDef).state;

    // turn 6: player at 10 HP (10 ≤ 12 = 60% of 20) → feint opportunity
    state = engine.executeAction(state, endTurnPlayer, feintDef).state;
    expect(state.turn.number).toBe(6);

    const action = ai.selectAction(state, feintDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const militiaman = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_MILITIAMAN_ID,
      )!;
      expect(
        militiaman.cards.find((c) => c.instanceId === action.cardInstanceId)!
          .definitionId,
      ).toBe(FEINT_ID);
    }
  });

  it("does not select Feint when the enemy is at full health", () => {
    // Player at 200 HP (100%) — well above 60% threshold → feint context does not fire.
    // Turn 2 (opening) → Guard selected instead.
    const ai = createCorruptedMilitiamanAi();
    const engine = createEngine();
    const state = engine.executeAction(
      createGame({ matchId: "m" as MatchId, definition: standardDef }),
      endTurnPlayer,
      standardDef,
    ).state;

    const action = ai.selectAction(state, standardDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const militiaman = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_MILITIAMAN_ID,
      )!;
      expect(
        militiaman.cards.find((c) => c.instanceId === action.cardInstanceId)!
          .definitionId,
      ).not.toBe(FEINT_ID);
    }
  });
});

describe("Corrupted Militiaman doctrine — Exploit behaviour", () => {
  it("immediately selects Exploit once Opening and low health are both present", () => {
    // Setup: player.maxHealth=20 (starts ≤ 25), loadout=[GUARD_ID].
    // Sequence:
    //   turn 2: Militiaman Guard
    //   turn 4: Militiaman Slash → player 10 HP
    //   turn 6: Militiaman Feint → FeintActive on Militiaman
    //   turn 7: Player uses Guard → Feint reactive trigger → Opening applied to player
    //   turn 8: player health=10 ≤ 25, player has Opening → Exploit ready!
    const exploitDef = {
      combatants: [
        {
          combatant: { ...player, maxHealth: 20 },
          loadout: { cardDefinitionIds: [GUARD_ID] },
        },
        { combatant: CorruptedMilitiaman, loadout: CorruptedMilitiamanLoadout },
      ],
      cardDefinitions: new Map([...CORRUPTED_MILITIAMAN_CARD_DEFINITIONS]),
    };

    const engine = createEngine();
    const ai = createCorruptedMilitiamanAi();
    let state = createGame({ matchId: "m" as MatchId, definition: exploitDef });

    // turn 2: Militiaman Guard
    state = engine.executeAction(state, endTurnPlayer, exploitDef).state;
    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: CORRUPTED_MILITIAMAN_ID,
        cardInstanceId: "corrupted-militiaman:2" as CardInstanceId,
      },
      exploitDef,
    ).state;
    state = engine.executeAction(state, endTurnMilitiaman, exploitDef).state;

    // turn 4: Militiaman Slash → player 20-10=10 HP
    state = engine.executeAction(state, endTurnPlayer, exploitDef).state;
    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: CORRUPTED_MILITIAMAN_ID,
        cardInstanceId: "corrupted-militiaman:1" as CardInstanceId,
      },
      exploitDef,
    ).state;
    state = engine.executeAction(state, endTurnMilitiaman, exploitDef).state;

    // turn 6: Militiaman Feint → FeintActive applied
    state = engine.executeAction(state, endTurnPlayer, exploitDef).state;
    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: CORRUPTED_MILITIAMAN_ID,
        cardInstanceId: "corrupted-militiaman:5" as CardInstanceId,
      },
      exploitDef,
    ).state;
    state = engine.executeAction(state, endTurnMilitiaman, exploitDef).state;

    // turn 7: Player uses Guard → Feint reactive trigger → Opening applied to player
    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: PLAYER_ID,
        cardInstanceId: "player:1" as CardInstanceId,
      },
      exploitDef,
    ).state;
    state = engine.executeAction(state, endTurnPlayer, exploitDef).state;

    // turn 8: verify Opening is active, then assert Exploit is selected (Recover deferred)
    expect(state.turn.number).toBe(8);
    expect(
      state.combatants
        .find((cs) => cs.combatant.id === PLAYER_ID)!
        .statuses.some((s) => s.type === StatusType.Opening),
    ).toBe(true);

    const action = ai.selectAction(state, exploitDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const militiaman = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_MILITIAMAN_ID,
      )!;
      expect(
        militiaman.cards.find((c) => c.instanceId === action.cardInstanceId)!
          .definitionId,
      ).toBe(EXPLOIT_ID);
    }
  });

  it("does not select Exploit when the enemy lacks Opening", () => {
    // player.maxHealth=20 → player starts at 20 HP ≤ 25 (health req met).
    // No Opening status → Exploit requirement fails → Exploit not in playable.
    // turn 2 (opening): Guard selected instead.
    const lowHpDef = {
      combatants: [
        {
          combatant: { ...player, maxHealth: 20 },
          loadout: { cardDefinitionIds: [] },
        },
        { combatant: CorruptedMilitiaman, loadout: CorruptedMilitiamanLoadout },
      ],
      cardDefinitions: new Map([...CORRUPTED_MILITIAMAN_CARD_DEFINITIONS]),
    };

    const ai = createCorruptedMilitiamanAi();
    const engine = createEngine();
    const state = engine.executeAction(
      createGame({ matchId: "m" as MatchId, definition: lowHpDef }),
      endTurnPlayer,
      lowHpDef,
    ).state;

    expect(state.turn.number).toBe(2);
    expect(
      state.combatants.find((cs) => cs.combatant.id === PLAYER_ID)!.health,
    ).toBeLessThanOrEqual(25);
    expect(
      state.combatants
        .find((cs) => cs.combatant.id === PLAYER_ID)!
        .statuses.some((s) => s.type === StatusType.Opening),
    ).toBe(false);

    const action = ai.selectAction(state, lowHpDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const militiaman = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_MILITIAMAN_ID,
      )!;
      expect(
        militiaman.cards.find((c) => c.instanceId === action.cardInstanceId)!
          .definitionId,
      ).not.toBe(EXPLOIT_ID);
    }
  });
});

describe("Corrupted Militiaman doctrine — legality", () => {
  it("never selects an illegal action in a full encounter", () => {
    const militiamanAi = createCorruptedMilitiamanAi();
    const playerAi = createBasicHeuristicAi();
    const engine = createEngine();
    let state = createGame({
      matchId: "m" as MatchId,
      definition: standardDef,
    });

    let i = 0;
    expect(() => {
      while (state.status === MatchStatus.InProgress && i < 200) {
        const isPlayerTurn = state.turn.activeCombatantId === PLAYER_ID;
        const ai = isPlayerTurn ? playerAi : militiamanAi;
        const action = ai.selectAction(state, standardDef);
        state = engine.executeAction(state, action, standardDef).state;
        i++;
      }
    }).not.toThrow();

    expect(state.status).toBe(MatchStatus.Completed);
  });
});
