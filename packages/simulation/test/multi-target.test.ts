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
  type CombatantDefinition,
  type CombatantId,
  type MatchId,
  type UseCardAction,
} from "../src";

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

describe("Volley", () => {
  it("deals 4 damage to each enemy", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [VOLLEY_ID] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    expect(result.state.combatants[1].health).toBe(16);
  });

  it("does not affect the actor", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [VOLLEY_ID] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    expect(result.state.combatants[0].health).toBe(20);
  });

  it("does not mutate prior state", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [VOLLEY_ID] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    expect(state.combatants[1].health).toBe(20);
  });
});

describe("Chain Lightning", () => {
  it("deals 6 damage to each enemy", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [CHAIN_LIGHTNING_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    expect(result.state.combatants[1].health).toBe(14);
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
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [burstCard.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    expect(result.state.combatants[1].health).toBe(15);
  });

  it("produces the same result from the same state (replay consistency)", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [VOLLEY_ID] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    expect(resultA.state.combatants[1].health).toBe(
      resultB.state.combatants[1].health,
    );
  });
});
