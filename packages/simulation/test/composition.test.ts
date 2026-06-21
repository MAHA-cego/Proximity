import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  Comparison,
  createEngine,
  createGame,
  EffectType,
  ModifierType,
  PREDATORY_STRIKE_ID,
  PredatoryStrike,
  RequirementSubject,
  RequirementType,
  SHATTER_ID,
  Shatter,
  TargetingType,
  Team,
  WARLORDS_RESOLVE_ID,
  WarlordsResolve,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
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

const selfDamage = (amount: number): CardDefinition => ({
  id: `self-damage-${amount}` as CardDefinitionId,
  cooldown: 0,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [{ type: EffectType.Damage, amount }],
    },
  ],
});

const enemyDamage = (amount: number): CardDefinition => ({
  id: `enemy-damage-${amount}` as CardDefinitionId,
  cooldown: 0,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [{ type: EffectType.Damage, amount }],
    },
  ],
});

describe("ConditionalEffect", () => {
  it("skips conditional effects when condition is not met", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [PREDATORY_STRIKE_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[PREDATORY_STRIKE_ID, PredatoryStrike]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const result = createEngine().executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:1" as CardInstanceId,
      },
      definition,
    );

    expect(result.state.combatants[1].health).toBe(15);
  });

  it("executes conditional effects when condition is met", () => {
    const setup = enemyDamage(15);

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [setup.id, PREDATORY_STRIKE_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [setup.id, setup],
        [PREDATORY_STRIKE_ID, PredatoryStrike],
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

    expect(state.combatants[1].health).toBe(5);

    const result = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:2" as CardInstanceId,
      },
      definition,
    );

    expect(result.state.combatants[1].health).toBe(-10);
  });

  it("condition is evaluated against state after preceding effects in the same ability", () => {
    const thresholdCard: CardDefinition = {
      id: "threshold-strike" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [
            { type: EffectType.Damage, amount: 12 },
            {
              type: EffectType.Conditional,
              condition: {
                type: RequirementType.Health,
                subject: RequirementSubject.Enemy,
                comparison: Comparison.Below,
                threshold: 10,
              },
              effects: [{ type: EffectType.Damage, amount: 3 }],
            },
          ],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [thresholdCard.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[thresholdCard.id, thresholdCard]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const result = createEngine().executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:1" as CardInstanceId,
      },
      definition,
    );

    expect(result.state.combatants[1].health).toBe(5);
  });
});

describe("WarlordsResolve — conditional self-heal", () => {
  it("heals 4 only when above threshold", () => {
    const setup = selfDamage(5);

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [setup.id, WARLORDS_RESOLVE_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [setup.id, setup],
        [WARLORDS_RESOLVE_ID, WarlordsResolve],
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

    expect(state.combatants[0].health).toBe(15);

    const result = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:2" as CardInstanceId,
      },
      definition,
    );

    expect(result.state.combatants[0].health).toBe(19);
  });

  it("heals 12 total when below threshold", () => {
    const setup = selfDamage(14);

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [setup.id, WARLORDS_RESOLVE_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [setup.id, setup],
        [WARLORDS_RESOLVE_ID, WarlordsResolve],
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

    expect(state.combatants[0].health).toBe(6);

    const result = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:2" as CardInstanceId,
      },
      definition,
    );

    expect(result.state.combatants[0].health).toBe(18);
  });
});

describe("EffectGroup", () => {
  it("executes all sub-effects in authored order", () => {
    const groupCard: CardDefinition = {
      id: "group-card" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [
            {
              type: EffectType.Group,
              effects: [
                { type: EffectType.Damage, amount: 3 },
                { type: EffectType.Damage, amount: 4 },
              ],
            },
          ],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [groupCard.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[groupCard.id, groupCard]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const result = createEngine().executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:1" as CardInstanceId,
      },
      definition,
    );

    expect(result.state.combatants[1].health).toBe(13);
  });

  it("group ordering is reflected in state transitions — damage before heal", () => {
    const orderedCard: CardDefinition = {
      id: "ordered" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [
            {
              type: EffectType.Group,
              effects: [
                { type: EffectType.Damage, amount: 3 },
                { type: EffectType.Heal, amount: 1 },
              ],
            },
          ],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [orderedCard.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[orderedCard.id, orderedCard]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const result = createEngine().executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:1" as CardInstanceId,
      },
      definition,
    );

    expect(result.state.combatants[0].health).toBe(18);
  });

  it("conditional inside a group is skipped when condition is not met", () => {
    const groupCard: CardDefinition = {
      id: "group-cond" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [
            {
              type: EffectType.Group,
              effects: [
                { type: EffectType.Damage, amount: 3 },
                {
                  type: EffectType.Conditional,
                  condition: {
                    type: RequirementType.Health,
                    subject: RequirementSubject.Enemy,
                    comparison: Comparison.Below,
                    threshold: 5,
                  },
                  effects: [{ type: EffectType.Damage, amount: 10 }],
                },
              ],
            },
          ],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [groupCard.id] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[groupCard.id, groupCard]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const result = createEngine().executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:1" as CardInstanceId,
      },
      definition,
    );

    expect(result.state.combatants[1].health).toBe(17);
  });
});

describe("Shatter", () => {
  it("deals 6 damage and applies -4 heal modifier when enemy is healthy", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [SHATTER_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[SHATTER_ID, Shatter]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const result = createEngine().executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:1" as CardInstanceId,
      },
      definition,
    );

    expect(result.state.combatants[1].health).toBe(14);
    expect(result.state.combatants[1].modifiers).toHaveLength(1);
    expect(result.state.combatants[1].modifiers[0]).toStrictEqual({
      type: ModifierType.Heal,
      amount: -4,
      remainingUses: 1,
    });
  });

  it("conditional fires when initial damage brings enemy below threshold", () => {
    const setup = enemyDamage(9);

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [setup.id, SHATTER_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [setup.id, setup],
        [SHATTER_ID, Shatter],
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

    expect(state.combatants[1].health).toBe(11);

    const result = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:2" as CardInstanceId,
      },
      definition,
    );

    expect(result.state.combatants[1].health).toBe(-1);
  });

  it("conditional uses state after the Group sub-effects complete", () => {
    const setup = enemyDamage(3);

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [setup.id, SHATTER_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [setup.id, setup],
        [SHATTER_ID, Shatter],
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

    expect(state.combatants[1].health).toBe(17);

    const result = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:2" as CardInstanceId,
      },
      definition,
    );

    expect(result.state.combatants[1].health).toBe(5);
  });
});

describe("Deterministic execution", () => {
  it("does not mutate prior state", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [PREDATORY_STRIKE_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[PREDATORY_STRIKE_ID, PredatoryStrike]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    createEngine().executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: playerOne.id,
        cardInstanceId: "player-1:1" as CardInstanceId,
      },
      definition,
    );

    expect(state.combatants[1].health).toBe(20);
  });

  it("produces the same result from the same state (replay consistency)", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [SHATTER_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[SHATTER_ID, Shatter]]),
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
    expect(resultA.state.combatants[1].modifiers).toStrictEqual(
      resultB.state.combatants[1].modifiers,
    );
  });
});
