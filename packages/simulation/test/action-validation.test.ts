import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  Comparison,
  createEngine,
  createGame,
  EffectType,
  InvalidActionError,
  RequirementType,
  TargetingType,
  Team,
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

const cardA: CardDefinition = {
  id: "card-a" as CardDefinitionId,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.None },
      effects: [],
    },
  ],
};

describe("Card Ownership Validation", () => {
  it("rejects an unknown card instance id", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map(),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:99" as CardInstanceId,
    };

    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow(InvalidActionError);
  });

  it("does not mutate state when card is not found", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map(),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:99" as CardInstanceId,
    };

    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();

    expect(state.combatants[0].health).toBe(20);
    expect(state.combatants[1].health).toBe(20);
  });

  it("rejects a card that belongs to another player", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [cardA.id] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-2:1" as CardInstanceId,
    };

    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow(InvalidActionError);
  });

  it("does not mutate state when card is not owned by actor", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [cardA.id] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-2:1" as CardInstanceId,
    };

    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();

    expect(state.combatants[0].cards).toHaveLength(0);
    expect(state.combatants[1].cards[0].remainingCooldown).toBe(0);
  });
});

describe("Cooldown Validation", () => {
  it("rejects a card that is on cooldown", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const { state: stateAfterUse } = engine.executeAction(
      state,
      action,
      definition,
    );

    expect(() =>
      engine.executeAction(stateAfterUse, action, definition),
    ).toThrow(InvalidActionError);
  });

  it("does not mutate state when card is on cooldown", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const { state: stateAfterUse } = engine.executeAction(
      state,
      action,
      definition,
    );

    expect(() =>
      engine.executeAction(stateAfterUse, action, definition),
    ).toThrow();

    expect(stateAfterUse.combatants[0].cards[0].remainingCooldown).toBe(2);
  });
});

describe("Requirement Validation", () => {
  it("rejects when a health requirement is not met", () => {
    const restrictedCard: CardDefinition = {
      id: "restricted" as CardDefinitionId,
      cooldown: 1,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 10 }],
          requirements: [
            {
              type: RequirementType.Health,
              comparison: Comparison.Below,
              threshold: 5,
            },
          ],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [restrictedCard.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[restrictedCard.id, restrictedCard]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow(InvalidActionError);
  });

  it("does not mutate state when a requirement is not met", () => {
    const restrictedCard: CardDefinition = {
      id: "restricted" as CardDefinitionId,
      cooldown: 1,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 10 }],
          requirements: [
            {
              type: RequirementType.Health,
              comparison: Comparison.Below,
              threshold: 5,
            },
          ],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [restrictedCard.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[restrictedCard.id, restrictedCard]]),
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

    expect(state.combatants[0].cards[0].remainingCooldown).toBe(0);
    expect(state.combatants[1].health).toBe(20);
  });
});
