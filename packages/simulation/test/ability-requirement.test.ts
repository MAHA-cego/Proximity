import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  Comparison,
  createEngine,
  createGame,
  EffectType,
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

function makeSetup(actorMaxHealth: number, card: CardDefinition) {
  const playerOne: CombatantDefinition = {
    id: "player-1" as CombatantId,
    team: Team.One,
    maxHealth: actorMaxHealth,
  };
  const playerTwo: CombatantDefinition = {
    id: "player-2" as CombatantId,
    team: Team.Two,
    maxHealth: 20,
  };

  const definition = {
    combatants: [
      { combatant: playerOne, loadout: { cardDefinitionIds: [card.id] } },
      { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
    ],
    cardDefinitions: new Map([[card.id, card]]),
  };

  const state = createGame({ matchId: "match-1" as MatchId, definition });

  const action: UseCardAction = {
    type: ActionType.UseCard,
    actorId: playerOne.id,
    cardInstanceId: "player-1:1" as CardInstanceId,
  };

  return { state, action, definition };
}

describe("HealthRequirement (Below)", () => {
  const card: CardDefinition = {
    id: "card-a" as CardDefinitionId,
    cooldown: 0,
    abilities: [
      {
        trigger: AbilityTrigger.OnUse,
        targeting: { type: TargetingType.SingleEnemy },
        effects: [{ type: EffectType.Damage, amount: 3 }],
        requirements: [
          {
            type: RequirementType.Health,
            comparison: Comparison.Below,
            threshold: 10,
          },
        ],
      },
    ],
  };

  it("executes when actor health is below threshold", () => {
    const { state, action, definition } = makeSetup(8, card);
    const result = createEngine().executeAction(state, action, definition);
    expect(result.state.combatants[1].health).toBe(17);
  });

  it("is blocked when actor health equals threshold", () => {
    const { state, action, definition } = makeSetup(10, card);
    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();
  });

  it("is blocked when actor health is above threshold", () => {
    const { state, action, definition } = makeSetup(15, card);
    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();
  });
});

describe("HealthRequirement (Above)", () => {
  const card: CardDefinition = {
    id: "card-a" as CardDefinitionId,
    cooldown: 0,
    abilities: [
      {
        trigger: AbilityTrigger.OnUse,
        targeting: { type: TargetingType.SingleEnemy },
        effects: [{ type: EffectType.Damage, amount: 3 }],
        requirements: [
          {
            type: RequirementType.Health,
            comparison: Comparison.Above,
            threshold: 10,
          },
        ],
      },
    ],
  };

  it("executes when actor health is above threshold", () => {
    const { state, action, definition } = makeSetup(15, card);
    const result = createEngine().executeAction(state, action, definition);
    expect(result.state.combatants[1].health).toBe(17);
  });

  it("is blocked when actor health equals threshold", () => {
    const { state, action, definition } = makeSetup(10, card);
    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();
  });

  it("is blocked when actor health is below threshold", () => {
    const { state, action, definition } = makeSetup(8, card);
    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();
  });
});

describe("Requirement Composition", () => {
  it("executes when all requirements pass", () => {
    const card: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 3 }],
          requirements: [
            {
              type: RequirementType.Health,
              comparison: Comparison.Below,
              threshold: 15,
            },
            {
              type: RequirementType.Health,
              comparison: Comparison.Above,
              threshold: 5,
            },
          ],
        },
      ],
    };

    const { state, action, definition } = makeSetup(10, card);
    const result = createEngine().executeAction(state, action, definition);
    expect(result.state.combatants[1].health).toBe(17);
  });

  it("is blocked when first requirement fails", () => {
    const card: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 3 }],
          requirements: [
            {
              type: RequirementType.Health,
              comparison: Comparison.Below,
              threshold: 5,
            },
            {
              type: RequirementType.Health,
              comparison: Comparison.Above,
              threshold: 5,
            },
          ],
        },
      ],
    };

    const { state, action, definition } = makeSetup(10, card);
    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();
  });

  it("is blocked when second requirement fails", () => {
    const card: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 3 }],
          requirements: [
            {
              type: RequirementType.Health,
              comparison: Comparison.Below,
              threshold: 15,
            },
            {
              type: RequirementType.Health,
              comparison: Comparison.Below,
              threshold: 5,
            },
          ],
        },
      ],
    };

    const { state, action, definition } = makeSetup(10, card);
    expect(() =>
      createEngine().executeAction(state, action, definition),
    ).toThrow();
  });
});
