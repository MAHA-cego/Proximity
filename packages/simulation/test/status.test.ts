import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  BATTLE_CRY_ID,
  BattleCry,
  createEngine,
  createGame,
  EffectType,
  IGNITE_ID,
  Ignite,
  IRON_WILL_ID,
  IronWill,
  MENDING_TOUCH_ID,
  MendingTouch,
  StatusType,
  TargetingType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type EndTurnAction,
  type MatchId,
  type CombatantDefinition,
  type CombatantId,
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

const endTurn = (actorId: CombatantId): EndTurnAction => ({
  type: ActionType.EndTurn,
  actorId,
});

const useCard = (
  actorId: CombatantId,
  cardInstanceId: CardInstanceId,
): UseCardAction => ({
  type: ActionType.UseCard,
  actorId,
  cardInstanceId,
});

describe("Burn", () => {
  it("applies Burn status to the enemy", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [IGNITE_ID] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[IGNITE_ID, Ignite]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });
    const result = createEngine().executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[1].statuses).toHaveLength(1);
    expect(result.state.combatants[1].statuses[0]).toStrictEqual({
      type: StatusType.Burn,
      remainingDuration: 3,
      amount: 2,
    });
  });

  it("deals damage at the start of the burned player's turn", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [IGNITE_ID] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[IGNITE_ID, Ignite]]),
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

    expect(state.combatants[1].health).toBe(18);
    expect(state.combatants[1].statuses[0].remainingDuration).toBe(2);
  });

  it("does not affect health before the burned player's turn", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [IGNITE_ID] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[IGNITE_ID, Ignite]]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    expect(state.combatants[1].health).toBe(20);
  });

  it("does not tick when the non-burned player becomes active", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [IGNITE_ID] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[IGNITE_ID, Ignite]]),
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

    expect(state.combatants[0].health).toBe(20);
  });

  it("ticks three times and then expires", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [IGNITE_ID] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[IGNITE_ID, Ignite]]),
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
    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    expect(state.combatants[1].health).toBe(14);
    expect(state.combatants[1].statuses).toHaveLength(0);
  });

  it("does not mutate prior state", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [IGNITE_ID] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[IGNITE_ID, Ignite]]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const afterIgnite = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    engine.executeAction(afterIgnite, endTurn(playerOne.id), definition);

    expect(afterIgnite.combatants[1].health).toBe(20);
  });
});

describe("Regeneration", () => {
  it("applies Regeneration status to self", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [MENDING_TOUCH_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[MENDING_TOUCH_ID, MendingTouch]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });
    const result = createEngine().executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[0].statuses).toHaveLength(1);
    expect(result.state.combatants[0].statuses[0]).toStrictEqual({
      type: StatusType.Regeneration,
      remainingDuration: 2,
      amount: 3,
    });
  });

  it("heals at the start of the player's own turn", () => {
    const selfDamage: CardDefinition = {
      id: "self-damage" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [{ type: EffectType.Damage, amount: 10 }],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [selfDamage.id, MENDING_TOUCH_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [selfDamage.id, selfDamage],
        [MENDING_TOUCH_ID, MendingTouch],
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
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
      definition,
    ).state;

    expect(state.combatants[0].health).toBe(10);

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

    expect(state.combatants[0].health).toBe(13);
    expect(state.combatants[0].statuses[0].remainingDuration).toBe(1);
  });

  it("does not tick when a different player becomes active", () => {
    const selfDamage: CardDefinition = {
      id: "self-damage" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [{ type: EffectType.Damage, amount: 5 }],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [selfDamage.id, MENDING_TOUCH_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [selfDamage.id, selfDamage],
        [MENDING_TOUCH_ID, MendingTouch],
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
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
      definition,
    ).state;

    expect(state.combatants[0].health).toBe(15);

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    expect(state.combatants[0].health).toBe(15);
  });

  it("respects maxHealth when healing", () => {
    const selfDamage: CardDefinition = {
      id: "self-damage" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [{ type: EffectType.Damage, amount: 2 }],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [selfDamage.id, MENDING_TOUCH_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [selfDamage.id, selfDamage],
        [MENDING_TOUCH_ID, MendingTouch],
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
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
      definition,
    ).state;

    expect(state.combatants[0].health).toBe(18);

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

    expect(state.combatants[0].health).toBe(20);

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

    expect(state.combatants[0].health).toBe(20);
    expect(state.combatants[0].statuses).toHaveLength(0);
  });
});

describe("Shield", () => {
  it("applies Shield status to self", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [IRON_WILL_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[IRON_WILL_ID, IronWill]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });
    const result = createEngine().executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[0].statuses).toHaveLength(1);
    expect(result.state.combatants[0].statuses[0]).toStrictEqual({
      type: StatusType.Shield,
      remainingDuration: 2,
      amount: 5,
    });
  });

  it("reduces incoming damage by the shield amount", () => {
    const attackCard: CardDefinition = {
      id: "attack" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 8 }],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [IRON_WILL_ID] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [attackCard.id] },
        },
      ],
      cardDefinitions: new Map([
        [IRON_WILL_ID, IronWill],
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

    const result = engine.executeAction(
      state,
      useCard(playerTwo.id, "player-2:1" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[0].health).toBe(17);
  });

  it("absorbs damage fully when damage is less than or equal to shield amount", () => {
    const weakAttack: CardDefinition = {
      id: "weak-attack" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 4 }],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [IRON_WILL_ID] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [weakAttack.id] },
        },
      ],
      cardDefinitions: new Map([
        [IRON_WILL_ID, IronWill],
        [weakAttack.id, weakAttack],
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

    const result = engine.executeAction(
      state,
      useCard(playerTwo.id, "player-2:1" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[0].health).toBe(20);
  });

  it("duration decrements at start of shielded player's turn", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [IRON_WILL_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[IRON_WILL_ID, IronWill]]),
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

    expect(state.combatants[0].statuses[0].remainingDuration).toBe(1);
  });

  it("no longer reduces damage after expiry", () => {
    const attackCard: CardDefinition = {
      id: "attack" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 8 }],
        },
      ],
    };

    const shortShield: CardDefinition = {
      id: "short-shield" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [
            {
              type: EffectType.ApplyStatus,
              statusType: StatusType.Shield,
              duration: 1,
              amount: 5,
            },
          ],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [shortShield.id] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [attackCard.id] },
        },
      ],
      cardDefinitions: new Map([
        [shortShield.id, shortShield],
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

    expect(state.combatants[0].statuses).toHaveLength(0);

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    const result = engine.executeAction(
      state,
      useCard(playerTwo.id, "player-2:1" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[0].health).toBe(12);
  });
});

describe("Status interactions", () => {
  it("Burn and Regeneration on the same player both tick", () => {
    const applyBoth: CardDefinition = {
      id: "apply-both" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [
            {
              type: EffectType.ApplyStatus,
              statusType: StatusType.Burn,
              duration: 2,
              amount: 5,
            },
            {
              type: EffectType.ApplyStatus,
              statusType: StatusType.Regeneration,
              duration: 2,
              amount: 2,
            },
          ],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [applyBoth.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[applyBoth.id, applyBoth]]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    expect(state.combatants[0].statuses).toHaveLength(2);

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

    expect(state.combatants[0].health).toBe(17);
  });

  it("Shield reduces damage amplified by attacker's damage modifier", () => {
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
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [BATTLE_CRY_ID, strikeCard.id] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [IRON_WILL_ID] },
        },
      ],
      cardDefinitions: new Map([
        [BATTLE_CRY_ID, BattleCry],
        [strikeCard.id, strikeCard],
        [IRON_WILL_ID, IronWill],
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
      useCard(playerTwo.id, "player-2:1" as CardInstanceId),
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

    expect(result.state.combatants[1].health).toBe(17);
  });

  it("OnTurnStart damage is reduced by target Shield", () => {
    const onTurnStartCard: CardDefinition = {
      id: "on-turn-start-hit" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnTurnStart,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 5 }],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [onTurnStartCard.id] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [IRON_WILL_ID] },
        },
      ],
      cardDefinitions: new Map([
        [onTurnStartCard.id, onTurnStartCard],
        [IRON_WILL_ID, IronWill],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    state = engine.executeAction(
      state,
      useCard(playerTwo.id, "player-2:1" as CardInstanceId),
      definition,
    ).state;

    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;

    expect(state.combatants[1].health).toBe(20);
  });
});

describe("Determinism", () => {
  it("produces the same result from the same state", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [IGNITE_ID] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[IGNITE_ID, Ignite]]),
    };

    const engine = createEngine();
    let stateA = createGame({ matchId: "match-1" as MatchId, definition });
    let stateB = createGame({ matchId: "match-1" as MatchId, definition });

    stateA = engine.executeAction(
      stateA,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    stateB = engine.executeAction(
      stateB,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    stateA = engine.executeAction(
      stateA,
      endTurn(playerOne.id),
      definition,
    ).state;
    stateB = engine.executeAction(
      stateB,
      endTurn(playerOne.id),
      definition,
    ).state;

    expect(stateA.combatants[1].health).toBe(stateB.combatants[1].health);
    expect(stateA.combatants[1].statuses).toStrictEqual(
      stateB.combatants[1].statuses,
    );
  });
});
