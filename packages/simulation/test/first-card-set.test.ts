import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  BasicStrike,
  BASIC_STRIKE_ID,
  createEngine,
  createGame,
  Desperation,
  DESPERATION_ID,
  EffectType,
  FirstAid,
  FIRST_AID_ID,
  SecondWind,
  SECOND_WIND_ID,
  TargetingType,
  Team,
  type CardDefinitionId,
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

describe("Basic Strike", () => {
  it("deals 6 damage to the enemy", () => {
    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [BASIC_STRIKE_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[BASIC_STRIKE_ID, BasicStrike]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[1].health).toBe(14);
    expect(result.state.players[0].health).toBe(20);
  });

  it("goes on cooldown after use", () => {
    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [BASIC_STRIKE_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[BASIC_STRIKE_ID, BasicStrike]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[0].cards[0].remainingCooldown).toBe(1);
  });
});

describe("First Aid", () => {
  it("restores 8 health to self", () => {
    const setupCard = {
      id: "setup" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.Passive,
          targeting: { type: TargetingType.Self },
          effects: [{ type: EffectType.Damage, amount: 12 }],
        },
      ],
    };

    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [FIRST_AID_ID, setupCard.id] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [FIRST_AID_ID, FirstAid],
        [setupCard.id, setupCard],
      ]),
    };

    const state = createEngine().initializeGame(
      "match-1" as MatchId,
      definition,
    );

    expect(state.players[0].health).toBe(8);

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[0].health).toBe(16);
    expect(result.state.players[1].health).toBe(20);
  });

  it("clamps heal at maxHealth", () => {
    const setupCard = {
      id: "setup" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.Passive,
          targeting: { type: TargetingType.Self },
          effects: [{ type: EffectType.Damage, amount: 3 }],
        },
      ],
    };

    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [FIRST_AID_ID, setupCard.id] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [FIRST_AID_ID, FirstAid],
        [setupCard.id, setupCard],
      ]),
    };

    const state = createEngine().initializeGame(
      "match-1" as MatchId,
      definition,
    );

    expect(state.players[0].health).toBe(17);

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[0].health).toBe(20);
  });
});

describe("Second Wind", () => {
  it("resets Basic Strike cooldown to zero", () => {
    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [BASIC_STRIKE_ID, SECOND_WIND_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [BASIC_STRIKE_ID, BasicStrike],
        [SECOND_WIND_ID, SecondWind],
      ]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const useStrike: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const state2 = engine.executeAction(state, useStrike, definition).state;

    expect(state2.players[0].cards[0].remainingCooldown).toBe(1);

    const useSecondWind: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:2" as CardInstanceId,
    };

    const result = engine.executeAction(state2, useSecondWind, definition);

    expect(result.state.players[0].cards[0].remainingCooldown).toBe(0);
  });
});

describe("Desperation", () => {
  it("deals 15 damage when actor health is below 10", () => {
    const damagedPlayer: Player = {
      id: "player-1" as PlayerId,
      team: Team.One,
      maxHealth: 8,
    };

    const definition = {
      players: [
        {
          player: damagedPlayer,
          loadout: { cardDefinitionIds: [DESPERATION_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[DESPERATION_ID, Desperation]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: damagedPlayer.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[1].health).toBe(5);
  });

  it("is blocked when actor health is 10 or above", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [DESPERATION_ID] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[DESPERATION_ID, Desperation]]),
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
