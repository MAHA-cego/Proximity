import { describe, expect, it } from "vitest";

import {
  ActionType,
  AbilityTrigger,
  CHAIN_LIGHTNING_ID,
  ChainLightning,
  createEngine,
  createGame,
  EffectType,
  TargetingType,
  Team,
  VOLLEY_ID,
  Volley,
  type CardDefinition,
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

describe("Volley", () => {
  it("deals 4 damage to each enemy", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [VOLLEY_ID] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[VOLLEY_ID, Volley]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[1].health).toBe(16);
  });

  it("does not affect the actor", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [VOLLEY_ID] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[VOLLEY_ID, Volley]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[0].health).toBe(20);
  });

  it("does not mutate prior state", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [VOLLEY_ID] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[VOLLEY_ID, Volley]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    createEngine().executeAction(state, action, definition);

    expect(state.players[1].health).toBe(20);
  });
});

describe("Chain Lightning", () => {
  it("deals 6 damage to each enemy", () => {
    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [CHAIN_LIGHTNING_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[CHAIN_LIGHTNING_ID, ChainLightning]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[1].health).toBe(14);
  });
});

describe("AllEnemies multi-target execution", () => {
  it("applies multiple effects to each enemy in authored order", () => {
    const burstCard: CardDefinition = {
      id: "burst" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.AllEnemies },
          effects: [
            { type: EffectType.Damage, amount: 3 },
            { type: EffectType.Damage, amount: 2 },
          ],
        },
      ],
    };

    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [burstCard.id] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[burstCard.id, burstCard]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[1].health).toBe(15);
  });

  it("produces the same result from the same state (replay consistency)", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [VOLLEY_ID] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[VOLLEY_ID, Volley]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const engine = createEngine();
    const resultA = engine.executeAction(state, action, definition);
    const resultB = engine.executeAction(state, action, definition);

    expect(resultA.state.players[1].health).toBe(
      resultB.state.players[1].health,
    );
  });
});
