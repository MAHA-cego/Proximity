import { describe, expect, it } from "vitest";

import {
  ActionType,
  AbilityTrigger,
  BATTLE_CRY_ID,
  BattleCry,
  ENFEEBLE_ID,
  Enfeeble,
  createEngine,
  createGame,
  EffectType,
  ModifierType,
  TargetingType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type EndTurnAction,
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

describe("BattleCry", () => {
  it("applies a damage modifier to the actor", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [BATTLE_CRY_ID] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[BATTLE_CRY_ID, BattleCry]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[0].modifiers).toHaveLength(1);
    expect(result.state.players[0].modifiers[0]).toStrictEqual({
      type: ModifierType.Damage,
      amount: 5,
      remainingUses: 1,
    });
  });

  it("does not affect the enemy's modifiers", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [BATTLE_CRY_ID] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[BATTLE_CRY_ID, BattleCry]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[1].modifiers).toHaveLength(0);
  });

  it("does not mutate prior state", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [BATTLE_CRY_ID] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[BATTLE_CRY_ID, BattleCry]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    createEngine().executeAction(state, action, definition);

    expect(state.players[0].modifiers).toHaveLength(0);
  });
});

describe("Enfeeble", () => {
  it("applies a negative heal modifier to the enemy", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [ENFEEBLE_ID] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[ENFEEBLE_ID, Enfeeble]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[1].modifiers).toHaveLength(1);
    expect(result.state.players[1].modifiers[0]).toStrictEqual({
      type: ModifierType.Heal,
      amount: -3,
      remainingUses: 1,
    });
  });
});

describe("Damage modifier consumption", () => {
  it("adds modifier bonus to damage and consumes the modifier", () => {
    const strikeCard: CardDefinition = {
      id: "strike" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 3 }],
        },
      ],
    };

    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [BATTLE_CRY_ID, strikeCard.id] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [BATTLE_CRY_ID, BattleCry],
        [strikeCard.id, strikeCard],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    const battleCryAction: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const afterBattleCry = engine.executeAction(
      state,
      battleCryAction,
      definition,
    );
    state = afterBattleCry.state;

    expect(state.players[0].modifiers).toHaveLength(1);

    const strikeAction: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:2" as CardInstanceId,
    };

    const afterStrike = engine.executeAction(state, strikeAction, definition);

    expect(afterStrike.state.players[1].health).toBe(12);
    expect(afterStrike.state.players[0].modifiers).toHaveLength(0);
  });

  it("damage without modifier applies base amount only", () => {
    const strikeCard: CardDefinition = {
      id: "strike" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 3 }],
        },
      ],
    };

    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [strikeCard.id] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[strikeCard.id, strikeCard]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const result = createEngine().executeAction(state, action, definition);

    expect(result.state.players[1].health).toBe(17);
  });

  it("modifier expires after one use", () => {
    const strikeCard: CardDefinition = {
      id: "strike" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 3 }],
        },
      ],
    };

    const definition = {
      players: [
        {
          player: playerOne,
          loadout: {
            cardDefinitionIds: [BATTLE_CRY_ID, strikeCard.id, strikeCard.id],
          },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [BATTLE_CRY_ID, BattleCry],
        [strikeCard.id, strikeCard],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:1" as CardInstanceId,
      },
      definition,
    ).state;

    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:2" as CardInstanceId,
      },
      definition,
    ).state;

    const afterSecondStrike = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:3" as CardInstanceId,
      },
      definition,
    );

    expect(afterSecondStrike.state.players[1].health).toBe(9);
  });
});

describe("Heal modifier consumption", () => {
  it("negative heal modifier reduces heal amount when target heals themselves", () => {
    const healCard: CardDefinition = {
      id: "heal-card" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [{ type: EffectType.Heal, amount: 5 }],
        },
      ],
    };

    const damageCard: CardDefinition = {
      id: "damage-card" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 10 }],
        },
      ],
    };

    const definition = {
      players: [
        {
          player: playerOne,
          loadout: {
            cardDefinitionIds: [ENFEEBLE_ID, damageCard.id],
          },
        },
        {
          player: playerTwo,
          loadout: { cardDefinitionIds: [healCard.id] },
        },
      ],
      cardDefinitions: new Map([
        [ENFEEBLE_ID, Enfeeble],
        [damageCard.id, damageCard],
        [healCard.id, healCard],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:1" as CardInstanceId,
      } as UseCardAction,
      definition,
    ).state;

    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:2" as CardInstanceId,
      } as UseCardAction,
      definition,
    ).state;

    expect(state.players[1].health).toBe(10);
    expect(state.players[1].modifiers).toHaveLength(1);

    const endTurn: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne.id,
    };
    state = engine.executeAction(state, endTurn, definition).state;

    const afterHeal = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerTwo.id,
        cardInstanceId: "player-2:1" as CardInstanceId,
      } as UseCardAction,
      definition,
    );

    expect(afterHeal.state.players[1].health).toBe(12);
    expect(afterHeal.state.players[1].modifiers).toHaveLength(0);
  });
});

describe("Modifier stacking", () => {
  it("multiple damage modifiers stack deterministically", () => {
    const strikeCard: CardDefinition = {
      id: "strike" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 2 }],
        },
      ],
    };

    const twoModCard: CardDefinition = {
      id: "two-mod" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [
            {
              type: EffectType.ApplyModifier,
              modifierType: ModifierType.Damage,
              amount: 3,
              uses: 1,
            },
            {
              type: EffectType.ApplyModifier,
              modifierType: ModifierType.Damage,
              amount: 4,
              uses: 1,
            },
          ],
        },
      ],
    };

    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [twoModCard.id, strikeCard.id] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [twoModCard.id, twoModCard],
        [strikeCard.id, strikeCard],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:1" as CardInstanceId,
      },
      definition,
    ).state;

    expect(state.players[0].modifiers).toHaveLength(2);

    const afterStrike = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:2" as CardInstanceId,
      },
      definition,
    );

    expect(afterStrike.state.players[1].health).toBe(11);
    expect(afterStrike.state.players[0].modifiers).toHaveLength(0);
  });

  it("produces the same result from the same state (replay consistency)", () => {
    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [BATTLE_CRY_ID] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[BATTLE_CRY_ID, BattleCry]]),
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

    expect(resultA.state.players[0].modifiers).toStrictEqual(
      resultB.state.players[0].modifiers,
    );
  });
});
