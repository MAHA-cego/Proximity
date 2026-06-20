import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  createEngine,
  createGame,
  EffectType,
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

describe("resolveEffects", () => {
  it("applies DamageEffect to SingleEnemy", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 5 }],
        },
      ],
    };

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

    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[1].health).toBe(15);
    expect(result.state.players[0].health).toBe(20);
    expect(state.players[1].health).toBe(20);
  });

  it("applies DamageEffect to Self", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [{ type: EffectType.Damage, amount: 3 }],
        },
      ],
    };

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

    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[0].health).toBe(17);
    expect(result.state.players[1].health).toBe(20);
    expect(state.players[0].health).toBe(20);
  });

  it("applies multiple effects in authored order", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [
            { type: EffectType.Damage, amount: 3 },
            { type: EffectType.Damage, amount: 2 },
          ],
        },
      ],
    };

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

    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
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

  it("applies HealEffect to increase health", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [
            { type: EffectType.Damage, amount: 5 },
            { type: EffectType.Heal, amount: 3 },
          ],
        },
      ],
    };

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

    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[0].health).toBe(18);
  });

  it("clamps HealEffect at maxHealth", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [
            { type: EffectType.Damage, amount: 5 },
            { type: EffectType.Heal, amount: 15 },
          ],
        },
      ],
    };

    const playerOne: Player = {
      id: "player-1" as PlayerId,
      team: Team.One,
      maxHealth: 10,
    };
    const playerTwo: Player = {
      id: "player-2" as PlayerId,
      team: Team.Two,
      maxHealth: 10,
    };

    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[0].health).toBe(10);
  });
});

describe("ReduceCooldownEffect", () => {
  it("reduces remaining cooldown of target card on self", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [
            {
              type: EffectType.ReduceCooldown,
              cardDefinitionId: "card-b" as CardDefinitionId,
              amount: 1,
            },
          ],
        },
      ],
    };

    const cardB: CardDefinition = {
      id: "card-b" as CardDefinitionId,
      cooldown: 2,
      abilities: [],
    };

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

    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [cardA.id, cardB.id] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [cardA.id, cardA],
        [cardB.id, cardB],
      ]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const useCardB: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:2" as CardInstanceId,
    };
    const state2 = engine.executeAction(state, useCardB, definition).state;

    expect(state2.players[0].cards[1].remainingCooldown).toBe(2);

    const useCardA: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };
    const result = engine.executeAction(state2, useCardA, definition);

    expect(result.state.players[0].cards[1].remainingCooldown).toBe(1);
  });

  it("clamps ReduceCooldownEffect at zero", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [
            {
              type: EffectType.ReduceCooldown,
              cardDefinitionId: "card-b" as CardDefinitionId,
              amount: 5,
            },
          ],
        },
      ],
    };

    const cardB: CardDefinition = {
      id: "card-b" as CardDefinitionId,
      cooldown: 2,
      abilities: [],
    };

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

    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [cardA.id, cardB.id] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [cardA.id, cardA],
        [cardB.id, cardB],
      ]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const useCardB: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:2" as CardInstanceId,
    };
    const state2 = engine.executeAction(state, useCardB, definition).state;

    const useCardA: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };
    const result = engine.executeAction(state2, useCardA, definition);

    expect(result.state.players[0].cards[1].remainingCooldown).toBe(0);
  });
});

describe("RefreshCooldownEffect", () => {
  it("resets remaining cooldown of target card to zero", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [
            {
              type: EffectType.RefreshCooldown,
              cardDefinitionId: "card-b" as CardDefinitionId,
            },
          ],
        },
      ],
    };

    const cardB: CardDefinition = {
      id: "card-b" as CardDefinitionId,
      cooldown: 3,
      abilities: [],
    };

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

    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [cardA.id, cardB.id] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [cardA.id, cardA],
        [cardB.id, cardB],
      ]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const useCardB: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:2" as CardInstanceId,
    };
    const state2 = engine.executeAction(state, useCardB, definition).state;

    expect(state2.players[0].cards[1].remainingCooldown).toBe(3);

    const useCardA: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };
    const result = engine.executeAction(state2, useCardA, definition);

    expect(result.state.players[0].cards[1].remainingCooldown).toBe(0);
  });
});

describe("Multiple Effect Composition", () => {
  it("executes heterogeneous effects in authored order", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [
            { type: EffectType.Damage, amount: 3 },
            {
              type: EffectType.ReduceCooldown,
              cardDefinitionId: "card-b" as CardDefinitionId,
              amount: 2,
            },
          ],
        },
      ],
    };

    const cardB: CardDefinition = {
      id: "card-b" as CardDefinitionId,
      cooldown: 3,
      abilities: [],
    };

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

    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [cardA.id, cardB.id] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [cardA.id, cardA],
        [cardB.id, cardB],
      ]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const useCardB: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:2" as CardInstanceId,
    };
    const state2 = engine.executeAction(state, useCardB, definition).state;

    const useCardA: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };
    const result = engine.executeAction(state2, useCardA, definition);

    expect(result.state.players[0].health).toBe(17);
    expect(result.state.players[0].cards[1].remainingCooldown).toBe(1);
  });
});
