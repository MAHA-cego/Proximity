import { describe, expect, it } from "vitest";

import {
  ActionType,
  AdrenalineRush,
  ADRENALINE_RUSH_ID,
  createEngine,
  createGame,
  EmergencyTreatment,
  EMERGENCY_TREATMENT_ID,
  FinishingBlow,
  FINISHING_BLOW_ID,
  STARTER_CARD_DEFINITIONS,
  STARTER_LOADOUT,
  TacticalBurst,
  TACTICAL_BURST_ID,
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

const playerTwo: Player = {
  id: "player-2" as PlayerId,
  team: Team.Two,
  maxHealth: 20,
};

describe("Finishing Blow", () => {
  it("deals 22 damage when actor health is below 8", () => {
    const lowHealthActor: Player = { ...playerOne, maxHealth: 7 };

    const definition = {
      players: [
        {
          player: lowHealthActor,
          loadout: { cardDefinitionIds: [FINISHING_BLOW_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[FINISHING_BLOW_ID, FinishingBlow]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: lowHealthActor.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[1].health).toBe(-2);
  });

  it("is blocked when actor health is 8 or above", () => {
    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [FINISHING_BLOW_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[FINISHING_BLOW_ID, FinishingBlow]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();
  });
});

describe("Emergency Treatment", () => {
  it("heals 12 health when actor health is below 10", () => {
    const lowHealthActor: Player = { ...playerOne, maxHealth: 8 };

    const definition = {
      players: [
        {
          player: lowHealthActor,
          loadout: { cardDefinitionIds: [EMERGENCY_TREATMENT_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[EMERGENCY_TREATMENT_ID, EmergencyTreatment]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: lowHealthActor.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[0].health).toBe(8);
  });

  it("is blocked when actor health is 10 or above", () => {
    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [EMERGENCY_TREATMENT_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[EMERGENCY_TREATMENT_ID, EmergencyTreatment]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();
  });
});

describe("Adrenaline Rush", () => {
  it("resets Finishing Blow cooldown to zero", () => {
    const definition = {
      players: [
        {
          player: { ...playerOne, maxHealth: 7 },
          loadout: {
            cardDefinitionIds: [FINISHING_BLOW_ID, ADRENALINE_RUSH_ID],
          },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [FINISHING_BLOW_ID, FinishingBlow],
        [ADRENALINE_RUSH_ID, AdrenalineRush],
      ]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const useFinishingBlow: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const state2 = engine.executeAction(
      state,
      useFinishingBlow,
      definition,
    ).state;

    expect(state2.players[0].cards[0].remainingCooldown).toBe(1);

    const useAdrenalineRush: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:2" as CardInstanceId,
    };

    const result = engine.executeAction(state2, useAdrenalineRush, definition);

    expect(result.state.players[0].cards[0].remainingCooldown).toBe(0);
  });
});

describe("Tactical Burst", () => {
  it("deals 8 damage to the enemy", () => {
    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [TACTICAL_BURST_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[TACTICAL_BURST_ID, TacticalBurst]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[1].health).toBe(12);
    expect(result.state.players[0].health).toBe(20);
  });

  it("reduces Finishing Blow cooldown by 1", () => {
    const definition = {
      players: [
        {
          player: { ...playerOne, maxHealth: 7 },
          loadout: {
            cardDefinitionIds: [FINISHING_BLOW_ID, TACTICAL_BURST_ID],
          },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [FINISHING_BLOW_ID, FinishingBlow],
        [TACTICAL_BURST_ID, TacticalBurst],
      ]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const useFinishingBlow: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const state2 = engine.executeAction(
      state,
      useFinishingBlow,
      definition,
    ).state;

    expect(state2.players[0].cards[0].remainingCooldown).toBe(1);

    const useTacticalBurst: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:2" as CardInstanceId,
    };

    const result = engine.executeAction(state2, useTacticalBurst, definition);

    expect(result.state.players[0].cards[0].remainingCooldown).toBe(0);
  });
});

describe("Starter Loadout", () => {
  it("initializes with all four cards at zero cooldown", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: STARTER_LOADOUT },
        { player: playerTwo, loadout: STARTER_LOADOUT },
      ],
      cardDefinitions: STARTER_CARD_DEFINITIONS,
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(state.players[0].cards).toHaveLength(4);
    expect(state.players[1].cards).toHaveLength(4);

    for (const playerState of state.players) {
      for (const card of playerState.cards) {
        expect(card.remainingCooldown).toBe(0);
      }
    }
  });

  it("both players share the same card definitions", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: STARTER_LOADOUT },
        { player: playerTwo, loadout: STARTER_LOADOUT },
      ],
      cardDefinitions: STARTER_CARD_DEFINITIONS,
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const p1DefinitionIds = state.players[0].cards.map((c) => c.definitionId);
    const p2DefinitionIds = state.players[1].cards.map((c) => c.definitionId);

    expect(p1DefinitionIds).toEqual(p2DefinitionIds);
  });
});
