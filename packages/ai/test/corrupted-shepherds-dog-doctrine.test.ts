import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  BERSERK_ID,
  CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS,
  CORRUPTED_SHEPHERDS_DOG_ID,
  CorruptedShepherdsDog,
  CorruptedShepherdsDogLoadout,
  createEngine,
  createGame,
  EffectType,
  LACERATION_ID,
  MatchStatus,
  PARRY_ID,
  StatusType,
  TargetingType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CombatantDefinition,
  type CombatantId,
  type MatchId,
} from "@proximity/simulation";

import { createBasicHeuristicAi, createCorruptedShepherdsDogAi } from "../src";

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
      combatant: CorruptedShepherdsDog,
      loadout: CorruptedShepherdsDogLoadout,
    },
  ],
  cardDefinitions: new Map([
    [playerStrike.id, playerStrike],
    ...CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS,
  ]),
};

const lowHealthDef = {
  combatants: [
    {
      combatant: player,
      loadout: { cardDefinitionIds: [] },
    },
    {
      combatant: { ...CorruptedShepherdsDog, maxHealth: 25 },
      loadout: CorruptedShepherdsDogLoadout,
    },
  ],
  cardDefinitions: new Map([...CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS]),
};

const endTurnPlayer = { type: ActionType.EndTurn as const, actorId: PLAYER_ID };

describe("Corrupted Shepherd's Dog doctrine — determinism", () => {
  it("produces the same action from the same state", () => {
    const ai = createCorruptedShepherdsDogAi();
    const engine = createEngine();
    const initial = createGame({
      matchId: "m" as MatchId,
      definition: standardDef,
    });
    const state = engine.executeAction(
      initial,
      endTurnPlayer,
      standardDef,
    ).state;

    const actionA = ai.selectAction(state, standardDef);
    const actionB = ai.selectAction(state, standardDef);

    expect(actionA).toStrictEqual(actionB);
  });

  it("produces identical results when replaying from the same initial state", () => {
    const run = () => {
      const ai = createCorruptedShepherdsDogAi();
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

describe("Corrupted Shepherd's Dog doctrine — opening preference", () => {
  it("selects Laceration on the first available turn", () => {
    const ai = createCorruptedShepherdsDogAi();
    const engine = createEngine();
    const initial = createGame({
      matchId: "m" as MatchId,
      definition: standardDef,
    });
    // turn.number=0 (player turn) → endTurn → turn.number=1 (dog turn, turnNumber<=2)
    const state = engine.executeAction(
      initial,
      endTurnPlayer,
      standardDef,
    ).state;

    const action = ai.selectAction(state, standardDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const dog = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_SHEPHERDS_DOG_ID,
      )!;
      const usedCard = dog.cards.find(
        (c) => c.instanceId === action.cardInstanceId,
      )!;
      expect(usedCard.definitionId).toBe(LACERATION_ID);
    }
  });
});

describe("Corrupted Shepherd's Dog doctrine — Berserk behaviour", () => {
  it("commits to Berserk when health is below 30 on a commit turn", () => {
    // Dog starts at maxHealth=25 (<30). turn.number starts at 1; after one player
    // EndTurn it becomes 2. 2 % 4 === 2 (≠ 0) → commit turn.
    const ai = createCorruptedShepherdsDogAi();
    const engine = createEngine();
    let state = createGame({
      matchId: "m" as MatchId,
      definition: lowHealthDef,
    });

    // turn 1 → player endTurn → turn 2 (dog's first turn, 2%4=2 → commit)
    state = engine.executeAction(state, endTurnPlayer, lowHealthDef).state;

    expect(state.turn.number).toBe(2);
    expect(
      state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_SHEPHERDS_DOG_ID,
      )!.health,
    ).toBeLessThan(30);

    const action = ai.selectAction(state, lowHealthDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const dog = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_SHEPHERDS_DOG_ID,
      )!;
      const usedCard = dog.cards.find(
        (c) => c.instanceId === action.cardInstanceId,
      )!;
      expect(usedCard.definitionId).toBe(BERSERK_ID);
    }
  });

  it("briefly hesitates before Berserk when health is below 30 on a hesitate turn", () => {
    // Dog starts at maxHealth=25. Advance to turn.number=4 (4%4=0 → hesitate).
    const ai = createCorruptedShepherdsDogAi();
    const engine = createEngine();
    let state = createGame({
      matchId: "m" as MatchId,
      definition: lowHealthDef,
    });

    // turn 1 → player endTurn → turn 2 (dog, commit) → dog endTurn → turn 3 (player)
    // → player endTurn → turn 4 (dog, 4%4=0 → hesitate)
    state = engine.executeAction(state, endTurnPlayer, lowHealthDef).state;
    state = engine.executeAction(
      state,
      { type: ActionType.EndTurn, actorId: CORRUPTED_SHEPHERDS_DOG_ID },
      lowHealthDef,
    ).state;
    state = engine.executeAction(state, endTurnPlayer, lowHealthDef).state;

    expect(state.turn.number).toBe(4);
    const action = ai.selectAction(state, lowHealthDef);

    // Should NOT be Berserk — must be a damage card
    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const dog = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_SHEPHERDS_DOG_ID,
      )!;
      const usedCard = dog.cards.find(
        (c) => c.instanceId === action.cardInstanceId,
      )!;
      expect(usedCard.definitionId).not.toBe(BERSERK_ID);
    }
  });

  it("never uses Parry when Berserk is active", () => {
    // Use turn 2 (commit) to trigger Berserk, then verify Parry is avoided on turn 4
    const ai = createCorruptedShepherdsDogAi();
    const engine = createEngine();
    let state = createGame({
      matchId: "m" as MatchId,
      definition: lowHealthDef,
    });

    // turn 1 → player endTurn → turn 2 (dog, commit)
    state = engine.executeAction(state, endTurnPlayer, lowHealthDef).state;

    // Dog uses Berserk (turn 2, 2%4=2 → commit)
    const berserkAction = ai.selectAction(state, lowHealthDef);
    expect(berserkAction.type).toBe(ActionType.UseCard);
    state = engine.executeAction(state, berserkAction, lowHealthDef).state;

    // Dog ends turn → turn 3 (player). Player ends turn → turn 4 (dog, Berserk active)
    state = engine.executeAction(
      state,
      { type: ActionType.EndTurn, actorId: CORRUPTED_SHEPHERDS_DOG_ID },
      lowHealthDef,
    ).state;
    state = engine.executeAction(state, endTurnPlayer, lowHealthDef).state;

    expect(
      state.combatants
        .find((cs) => cs.combatant.id === CORRUPTED_SHEPHERDS_DOG_ID)!
        .statuses.some((s) => s.type === StatusType.Berserk),
    ).toBe(true);

    const action = ai.selectAction(state, lowHealthDef);
    if (action.type === ActionType.UseCard) {
      const dog = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_SHEPHERDS_DOG_ID,
      )!;
      const usedCard = dog.cards.find(
        (c) => c.instanceId === action.cardInstanceId,
      )!;
      expect(usedCard.definitionId).not.toBe(PARRY_ID);
    }
  });
});

describe("Corrupted Shepherd's Dog doctrine — defensive imperfection", () => {
  it("does not select Parry when damage cards are available", () => {
    const ai = createCorruptedShepherdsDogAi();
    const engine = createEngine();
    const initial = createGame({
      matchId: "m" as MatchId,
      definition: standardDef,
    });
    const state = engine.executeAction(
      initial,
      endTurnPlayer,
      standardDef,
    ).state;

    const action = ai.selectAction(state, standardDef);

    expect(action.type).toBe(ActionType.UseCard);
    if (action.type === ActionType.UseCard) {
      const dog = state.combatants.find(
        (cs) => cs.combatant.id === CORRUPTED_SHEPHERDS_DOG_ID,
      )!;
      const usedCard = dog.cards.find(
        (c) => c.instanceId === action.cardInstanceId,
      )!;
      expect(usedCard.definitionId).not.toBe(PARRY_ID);
    }
  });
});

describe("Corrupted Shepherd's Dog doctrine — legality", () => {
  it("never selects an illegal action in a full encounter", () => {
    const dogAi = createCorruptedShepherdsDogAi();
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
        const ai = isPlayerTurn ? playerAi : dogAi;
        const action = ai.selectAction(state, standardDef);
        state = engine.executeAction(state, action, standardDef).state;
        i++;
      }
    }).not.toThrow();

    expect(state.status).toBe(MatchStatus.Completed);
  });
});
