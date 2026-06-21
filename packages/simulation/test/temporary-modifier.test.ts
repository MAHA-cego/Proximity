import { describe, expect, it } from "vitest";

import {
  ActionType,
  AbilityTrigger,
  BATTLE_CRY_ID,
  BattleCry,
  createEngine,
  createGame,
  EffectType,
  ModifierType,
  PREPARATION_ID,
  Preparation,
  TargetingType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type CombatantDefinition,
  type CombatantId,
  type EndTurnAction,
  type MatchId,
  type UseCardAction,
} from "../src";

const playerOne: CombatantDefinition = {
  id: "player-1" as CombatantId,
  team: Team.One,
  maxHealth: 100,
};

const playerTwo: CombatantDefinition = {
  id: "player-2" as CombatantId,
  team: Team.Two,
  maxHealth: 100,
};

const attackCard: CardDefinition = {
  id: "attack" as CardDefinitionId,
  cooldown: 0,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [{ type: EffectType.Damage, amount: 10 }],
    },
  ],
};

const useCard = (
  actorId: CombatantId,
  cardInstanceId: CardInstanceId,
): UseCardAction => ({
  type: ActionType.UseCard,
  actorId,
  cardInstanceId,
});

const endTurn = (actorId: CombatantId): EndTurnAction => ({
  type: ActionType.EndTurn,
  actorId,
});

describe("Battle Cry", () => {
  it("applies a +8 damage modifier to self", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [BATTLE_CRY_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[BATTLE_CRY_ID, BattleCry]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });
    const result = createEngine().executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[0].modifiers).toHaveLength(1);
    expect(result.state.combatants[0].modifiers[0]).toStrictEqual({
      type: ModifierType.Damage,
      amount: 8,
      remainingUses: 1,
      remainingDuration: 3,
    });
  });

  it("boosted attack deals +8 damage and consumes the modifier", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [BATTLE_CRY_ID, attackCard.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [BATTLE_CRY_ID, BattleCry],
        [attackCard.id, attackCard],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;

    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[1].health).toBe(82);
    expect(result.state.combatants[0].modifiers).toHaveLength(0);
  });

  it("modifier expires after 2 unused turns", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [BATTLE_CRY_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[BATTLE_CRY_ID, BattleCry]]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;

    expect(state.combatants[0].modifiers[0].remainingDuration).toBe(2);

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;

    expect(state.combatants[0].modifiers[0].remainingDuration).toBe(1);

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;

    expect(state.combatants[0].modifiers).toHaveLength(0);
  });

  it("modifier is still available on the second unused turn", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [BATTLE_CRY_ID, attackCard.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [BATTLE_CRY_ID, BattleCry],
        [attackCard.id, attackCard],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;
    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;

    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[1].health).toBe(82);
    expect(result.state.combatants[0].modifiers).toHaveLength(0);
  });
});

describe("Preparation", () => {
  it("applies a +15 damage modifier to self", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [PREPARATION_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[PREPARATION_ID, Preparation]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });
    const result = createEngine().executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[0].modifiers).toHaveLength(1);
    expect(result.state.combatants[0].modifiers[0]).toStrictEqual({
      type: ModifierType.Damage,
      amount: 15,
      remainingUses: 1,
      remainingDuration: 2,
    });
  });

  it("boosted attack deals +15 damage and consumes the modifier", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [PREPARATION_ID, attackCard.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [PREPARATION_ID, Preparation],
        [attackCard.id, attackCard],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;

    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[1].health).toBe(75);
    expect(result.state.combatants[0].modifiers).toHaveLength(0);
  });

  it("modifier expires after 1 unused turn", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [PREPARATION_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[PREPARATION_ID, Preparation]]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;

    expect(state.combatants[0].modifiers[0].remainingDuration).toBe(1);

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;

    expect(state.combatants[0].modifiers).toHaveLength(0);
  });

  it("modifier does not expire before the next turn", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [PREPARATION_ID, attackCard.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [PREPARATION_ID, Preparation],
        [attackCard.id, attackCard],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;

    expect(state.combatants[0].modifiers).toHaveLength(1);
  });
});

describe("Modifier without duration", () => {
  it("persists indefinitely when no duration is set", () => {
    const noExpiryModCard: CardDefinition = {
      id: "no-expiry" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [
            {
              type: EffectType.ApplyModifier,
              modifierType: ModifierType.Damage,
              amount: 5,
              uses: 2,
            },
          ],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [noExpiryModCard.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[noExpiryModCard.id, noExpiryModCard]]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    for (let i = 0; i < 5; i++) {
      state = engine.executeAction(
        state,
        endTurn(playerOne.id),
        definition,
      ).state;
      state = engine.executeAction(
        state,
        endTurn(playerTwo.id),
        definition,
      ).state;
    }

    expect(state.combatants[0].modifiers).toHaveLength(1);
    expect(state.combatants[0].modifiers[0].remainingUses).toBe(2);
  });
});
