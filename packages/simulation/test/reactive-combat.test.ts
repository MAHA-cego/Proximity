import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  createEngine,
  createGame,
  EffectType,
  FEINT_ID,
  Feint,
  PARRY_ID,
  Parry,
  StatusType,
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

const heavyAttackCard: CardDefinition = {
  id: "heavy-attack" as CardDefinitionId,
  cooldown: 0,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [{ type: EffectType.Damage, amount: 20 }],
    },
  ],
};

// Inline Guard card using the canonical ID "guard" so Feint's CardUsedRequirement matches it
const inlineGuard: CardDefinition = {
  id: "guard" as CardDefinitionId,
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
          amount: 10,
        },
      ],
    },
  ],
};

const otherCard: CardDefinition = {
  id: "other" as CardDefinitionId,
  cooldown: 0,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [{ type: EffectType.Heal, amount: 1 }],
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

describe("Parry", () => {
  it("intercepts an attack of 15 or less and reflects the damage to the attacker", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [attackCard.id] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [PARRY_ID] },
        },
      ],
      cardDefinitions: new Map([
        [attackCard.id, attackCard],
        [PARRY_ID, Parry],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 passes → P2's turn
    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    // P2 uses Parry
    state = engine.executeAction(
      state,
      useCard(playerTwo.id, "player-2:1" as CardInstanceId),
      definition,
    ).state;

    // P2 EndTurn → P1's turn
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;

    // P1 attacks with 10 damage — within Parry threshold of 15
    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    // P2 takes no damage (parried)
    expect(result.state.combatants[1].health).toBe(100);
    // P1 takes the reflected 10 damage
    expect(result.state.combatants[0].health).toBe(90);
  });

  it("does not intercept an attack exceeding 15 damage", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [heavyAttackCard.id] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [PARRY_ID] },
        },
      ],
      cardDefinitions: new Map([
        [heavyAttackCard.id, heavyAttackCard],
        [PARRY_ID, Parry],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 passes → P2's turn
    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    // P2 uses Parry
    state = engine.executeAction(
      state,
      useCard(playerTwo.id, "player-2:1" as CardInstanceId),
      definition,
    ).state;

    // P2 EndTurn → P1's turn
    state = engine.executeAction(
      state,
      endTurn(playerTwo.id),
      definition,
    ).state;

    // P1 attacks with 20 damage — exceeds Parry threshold
    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    // P2 takes the full 20 damage
    expect(result.state.combatants[1].health).toBe(80);
    // P1 takes no reflected damage
    expect(result.state.combatants[0].health).toBe(100);
  });

  it("Parry is consumed after successfully intercepting an attack", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [attackCard.id] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [PARRY_ID] },
        },
      ],
      cardDefinitions: new Map([
        [attackCard.id, attackCard],
        [PARRY_ID, Parry],
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

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    // Parry was consumed — P2 has no statuses
    expect(state.combatants[1].statuses).toHaveLength(0);
  });

  it("Parry expires at the start of the defender's next turn if not triggered", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [PARRY_ID] },
        },
      ],
      cardDefinitions: new Map([[PARRY_ID, Parry]]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 passes → P2's turn
    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    // P2 plays Parry
    state = engine.executeAction(
      state,
      useCard(playerTwo.id, "player-2:1" as CardInstanceId),
      definition,
    ).state;

    expect(state.combatants[1].statuses).toHaveLength(1);

    // P2 EndTurn → P1's turn (P1 passes) → P2's turn starts: Parry ticks (1→0) and expires
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

    expect(state.combatants[1].statuses).toHaveLength(0);
  });
});

describe("Feint", () => {
  it("applies FeintActive to self on use", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [FEINT_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[FEINT_ID, Feint]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });
    const result = createEngine().executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[0].statuses).toHaveLength(1);
    expect(result.state.combatants[0].statuses[0].type).toBe(
      StatusType.FeintActive,
    );
  });

  it("applies Opening to the opponent when they use Parry while FeintActive", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [FEINT_ID] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [PARRY_ID] },
        },
      ],
      cardDefinitions: new Map([
        [FEINT_ID, Feint],
        [PARRY_ID, Parry],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 plays Feint (FeintActive applied to P1)
    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    // P1 EndTurn → P2's turn
    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    // P2 plays Parry — triggers Feint's OnOpponentCardUse reaction
    const result = engine.executeAction(
      state,
      useCard(playerTwo.id, "player-2:1" as CardInstanceId),
      definition,
    );

    const p2Statuses = result.state.combatants[1].statuses;
    const openingStatus = p2Statuses.find((s) => s.type === StatusType.Opening);
    expect(openingStatus).toBeDefined();
    expect(openingStatus!.remainingDuration).toBe(2);
  });

  it("applies Opening when the opponent uses Guard while FeintActive", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [FEINT_ID] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [inlineGuard.id] },
        },
      ],
      cardDefinitions: new Map([
        [FEINT_ID, Feint],
        [inlineGuard.id, inlineGuard],
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

    const openingStatus = result.state.combatants[1].statuses.find(
      (s) => s.type === StatusType.Opening,
    );
    expect(openingStatus).toBeDefined();
  });

  it("does not apply Opening when the opponent uses an unrelated card", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [FEINT_ID] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [otherCard.id] },
        },
      ],
      cardDefinitions: new Map([
        [FEINT_ID, Feint],
        [otherCard.id, otherCard],
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

    const openingStatus = result.state.combatants[1].statuses.find(
      (s) => s.type === StatusType.Opening,
    );
    expect(openingStatus).toBeUndefined();
  });

  it("does not apply Opening if FeintActive has already expired", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [FEINT_ID] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [PARRY_ID] },
        },
      ],
      cardDefinitions: new Map([
        [FEINT_ID, Feint],
        [PARRY_ID, Parry],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 plays Feint
    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    // P1 EndTurn → P2 passes → P1's turn starts: FeintActive expires
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

    // P1 passes → P2's turn (two full cycles since Feint)
    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    // P2 plays Parry — FeintActive is gone, no Opening triggered
    const result = engine.executeAction(
      state,
      useCard(playerTwo.id, "player-2:1" as CardInstanceId),
      definition,
    );

    const openingStatus = result.state.combatants[1].statuses.find(
      (s) => s.type === StatusType.Opening,
    );
    expect(openingStatus).toBeUndefined();
  });

  it("Opening expires after one opponent turn", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [FEINT_ID] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [PARRY_ID] },
        },
      ],
      cardDefinitions: new Map([
        [FEINT_ID, Feint],
        [PARRY_ID, Parry],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 plays Feint → P1 EndTurn → P2's turn
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

    // P2 plays Parry — Opening applied (duration:2)
    state = engine.executeAction(
      state,
      useCard(playerTwo.id, "player-2:1" as CardInstanceId),
      definition,
    ).state;

    expect(
      state.combatants[1].statuses.some((s) => s.type === StatusType.Opening),
    ).toBe(true);

    // P2 EndTurn → P1's turn → P1 passes → P2's turn starts: Opening ticks (2→1), still active
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

    expect(
      state.combatants[1].statuses.some((s) => s.type === StatusType.Opening),
    ).toBe(true);

    // P2 EndTurn → P1's turn → P1 passes → P2's turn starts: Opening ticks (1→0), expires
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

    expect(
      state.combatants[1].statuses.some((s) => s.type === StatusType.Opening),
    ).toBe(false);
  });
});
