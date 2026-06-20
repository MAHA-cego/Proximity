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
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
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
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    expect(state.players[0].health).toBe(20);
    expect(state.players[1].health).toBe(20);
  });

  it("rejects a card that belongs to another player", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [cardA.id] } },
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
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [cardA.id] } },
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

    expect(state.players[0].cards).toHaveLength(0);
    expect(state.players[1].cards[0].remainingCooldown).toBe(0);
  });
});

describe("Cooldown Validation", () => {
  it("rejects a card that is on cooldown", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
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
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    expect(stateAfterUse.players[0].cards[0].remainingCooldown).toBe(2);
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
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [restrictedCard.id] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
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
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [restrictedCard.id] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    expect(state.players[0].cards[0].remainingCooldown).toBe(0);
    expect(state.players[1].health).toBe(20);
  });
});
