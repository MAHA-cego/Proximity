import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  CORRUPTED_HUNTER_CARD_DEFINITIONS,
  CORRUPTED_HUNTER_ID,
  CorruptedHunter,
  CorruptedHunterLoadout,
  createEngine,
  createGame,
  EffectType,
  HEAVY_STRIKE_ID,
  MatchStatus,
  ModifierType,
  PREPARATION_ID,
  RECOVER_ID,
  REGENERATION_ID,
  Regeneration,
  SLASH_ID,
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

import { createBasicHeuristicAi, createCorruptedHunterAi } from "../src";

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
      effects: [{ type: EffectType.Damage, amount: 20 }],
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
      combatant: CorruptedHunter,
      loadout: CorruptedHunterLoadout,
    },
  ],
  cardDefinitions: new Map([
    [playerStrike.id, playerStrike],
    ...CORRUPTED_HUNTER_CARD_DEFINITIONS,
  ]),
};

const endTurnPlayer = { type: ActionType.EndTurn as const, actorId: PLAYER_ID };
const endTurnHunter = {
  type: ActionType.EndTurn as const,
  actorId: CORRUPTED_HUNTER_ID,
};

describe("Corrupted Hunter doctrine — determinism", () => {
  it("produces the same action from the same state", () => {
    const ai = createCorruptedHunterAi();
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
      const ai = createCorruptedHunterAi();
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

describe("Corrupted Hunter doctrine — opening preference", () => {
  it("selects Preparation on the first available turn", () => {
    const ai = createCorruptedHunterAi();
    const engine = createEngine();
    // turn 1 → endTurnPlayer → turn 2 (hunter, turnNumber<=2 → Preparation first)
    const state = engine.executeAction(
      createGame({ matchId: "m" as MatchId, definition: standardDef }),
      endTurnPlayer,
      standardDef,
    ).state;

    const action = ai.selectAction(state, standardDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const hunter = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_HUNTER_ID,
      )!;
      expect(
        hunter.cards.find((c) => c.instanceId === action.cardInstanceId)!
          .definitionId,
      ).toBe(PREPARATION_ID);
    }
  });
});

describe("Corrupted Hunter doctrine — Preparation follow-up", () => {
  it("follows Preparation with Heavy Strike when the Damage modifier is active", () => {
    // Hunter uses Preparation on turn 2 → modifier(duration:2).
    // Start of turn 4: CooldownSystem ticks modifier to 1.
    // 4 % 6 ≠ 0 → no delay → Heavy Strike selected.
    const ai = createCorruptedHunterAi();
    const engine = createEngine();
    let state = createGame({
      matchId: "m" as MatchId,
      definition: standardDef,
    });

    state = engine.executeAction(state, endTurnPlayer, standardDef).state; // turn 2
    state = engine.executeAction(
      state,
      ai.selectAction(state, standardDef), // Preparation
      standardDef,
    ).state;
    state = engine.executeAction(state, endTurnHunter, standardDef).state; // turn 3
    state = engine.executeAction(state, endTurnPlayer, standardDef).state; // turn 4

    expect(state.turn.number).toBe(4);
    const action = ai.selectAction(state, standardDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const hunter = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_HUNTER_ID,
      )!;
      expect(
        hunter.cards.find((c) => c.instanceId === action.cardInstanceId)!
          .definitionId,
      ).toBe(HEAVY_STRIKE_ID);
    }
  });

  it("occasionally delays Heavy Strike (Slash first on turn 6)", () => {
    // Hunter skips turn 2, uses Preparation on turn 4 → modifier(duration:2).
    // Start of turn 6: CooldownSystem ticks modifier to 1.
    // 6 % 6 === 0 → delay → Slash selected before Heavy Strike.
    const ai = createCorruptedHunterAi();
    const engine = createEngine();
    let state = createGame({
      matchId: "m" as MatchId,
      definition: standardDef,
    });

    state = engine.executeAction(state, endTurnPlayer, standardDef).state; // turn 2
    state = engine.executeAction(state, endTurnHunter, standardDef).state; // turn 3 (skip Prep)
    state = engine.executeAction(state, endTurnPlayer, standardDef).state; // turn 4
    // Hunter uses Preparation on turn 4 (default priority → Preparation first)
    state = engine.executeAction(
      state,
      ai.selectAction(state, standardDef),
      standardDef,
    ).state;
    state = engine.executeAction(state, endTurnHunter, standardDef).state; // turn 5
    state = engine.executeAction(state, endTurnPlayer, standardDef).state; // turn 6

    expect(state.turn.number).toBe(6);
    const hunter = state.combatants.find(
      (cs) => cs.combatant.id === CORRUPTED_HUNTER_ID,
    )!;
    // Confirm modifier is still active (duration ticked from 2 to 1 at start of turn 6)
    expect(hunter.modifiers.some((m) => m.type === ModifierType.Damage)).toBe(
      true,
    );

    const action = ai.selectAction(state, standardDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      expect(
        hunter.cards.find((c) => c.instanceId === action.cardInstanceId)!
          .definitionId,
      ).toBe(SLASH_ID);
    }
  });
});

describe("Corrupted Hunter doctrine — healing preference", () => {
  it("prefers Regeneration over Recover when not in emergency", () => {
    // Custom definition: hunter has only Regeneration and Recover.
    // Opening priority falls through Preparation (not in loadout) to Regeneration.
    const regenRecoverDef = {
      combatants: [
        { combatant: player, loadout: { cardDefinitionIds: [] } },
        {
          combatant: CorruptedHunter,
          loadout: { cardDefinitionIds: [REGENERATION_ID, RECOVER_ID] },
        },
      ],
      cardDefinitions: new Map([...CORRUPTED_HUNTER_CARD_DEFINITIONS]),
    };

    const ai = createCorruptedHunterAi();
    const engine = createEngine();
    const state = engine.executeAction(
      createGame({ matchId: "m" as MatchId, definition: regenRecoverDef }),
      endTurnPlayer,
      regenRecoverDef,
    ).state;

    const action = ai.selectAction(state, regenRecoverDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const hunter = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_HUNTER_ID,
      )!;
      expect(
        hunter.cards.find((c) => c.instanceId === action.cardInstanceId)!
          .definitionId,
      ).toBe(REGENERATION_ID);
    }
  });
});

describe("Corrupted Hunter doctrine — aggression on opponent healing", () => {
  it("prioritises Heavy Strike when the player has Regeneration active", () => {
    const aggressionDef = {
      combatants: [
        {
          combatant: player,
          loadout: { cardDefinitionIds: [REGENERATION_ID] },
        },
        { combatant: CorruptedHunter, loadout: CorruptedHunterLoadout },
      ],
      cardDefinitions: new Map([
        [REGENERATION_ID, Regeneration],
        ...CORRUPTED_HUNTER_CARD_DEFINITIONS,
      ]),
    };

    const ai = createCorruptedHunterAi();
    const engine = createEngine();
    let state = createGame({
      matchId: "m" as MatchId,
      definition: aggressionDef,
    });

    // Player uses Regeneration → gains Regeneration status
    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: PLAYER_ID,
        cardInstanceId: "player:1" as CardInstanceId,
      },
      aggressionDef,
    ).state;
    // Player endTurns → turn 2 (hunter). Enemy has Regeneration → aggression.
    state = engine.executeAction(state, endTurnPlayer, aggressionDef).state;

    expect(
      state.combatants
        .find((cs) => cs.combatant.id === PLAYER_ID)!
        .statuses.some((s) => s.type === StatusType.Regeneration),
    ).toBe(true);

    const action = ai.selectAction(state, aggressionDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const hunter = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_HUNTER_ID,
      )!;
      expect(
        hunter.cards.find((c) => c.instanceId === action.cardInstanceId)!
          .definitionId,
      ).toBe(HEAVY_STRIKE_ID);
    }
  });
});

describe("Corrupted Hunter doctrine — legality", () => {
  it("never selects an illegal action in a full encounter", () => {
    const hunterAi = createCorruptedHunterAi();
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
        const ai = isPlayerTurn ? playerAi : hunterAi;
        const action = ai.selectAction(state, standardDef);
        state = engine.executeAction(state, action, standardDef).state;
        i++;
      }
    }).not.toThrow();

    expect(state.status).toBe(MatchStatus.Completed);
  });
});
