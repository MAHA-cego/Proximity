import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  BERSERK_ID,
  Berserk,
  Comparison,
  createEngine,
  createGame,
  EffectType,
  EXPLOIT_ID,
  Exploit,
  FEINT_ID,
  Feint,
  PARRY_ID,
  Parry,
  RequirementSubject,
  RequirementType,
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

// A card that directly applies Opening to the enemy for test setup
const openingCard: CardDefinition = {
  id: "opening-card" as CardDefinitionId,
  cooldown: 0,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [
        {
          type: EffectType.ApplyStatus,
          statusType: StatusType.Opening,
          duration: 2,
          amount: 0,
          restrictedCardIds: [PARRY_ID, "guard" as CardDefinitionId],
        },
      ],
    },
  ],
};

// A card with restriction for testing blocked play
const restrictedCard: CardDefinition = {
  id: "restricted" as CardDefinitionId,
  cooldown: 0,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [{ type: EffectType.Heal, amount: 1 }],
    },
  ],
};

// Card that damages the user (to get below 30 for Berserk)
const selfDamageCard: CardDefinition = {
  id: "self-damage" as CardDefinitionId,
  cooldown: 0,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [{ type: EffectType.Damage, amount: 75 }],
    },
  ],
};

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

describe("Berserk", () => {
  it("cannot be used above 30 health", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [BERSERK_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[BERSERK_ID, Berserk]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(() =>
      createEngine().executeAction(
        state,
        useCard(playerOne.id, "player-1:1" as CardInstanceId),
        definition,
      ),
    ).toThrow();
  });

  it("can be used below 30 health", () => {
    const definition = {
      combatants: [
        {
          combatant: { ...playerOne, maxHealth: 100 },
          loadout: { cardDefinitionIds: [selfDamageCard.id, BERSERK_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [selfDamageCard.id, selfDamageCard],
        [BERSERK_ID, Berserk],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 damages self to drop below 30
    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    // P1 EndTurn → P2 passes → P1's turn
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

    // P1 now at 25 health — Berserk should be playable
    expect(state.combatants[0].health).toBe(25);
    expect(() =>
      engine.executeAction(
        state,
        useCard(playerOne.id, "player-1:2" as CardInstanceId),
        definition,
      ),
    ).not.toThrow();
  });

  it("doubles attack damage while active", () => {
    const definition = {
      combatants: [
        {
          combatant: { ...playerOne, maxHealth: 100 },
          loadout: {
            cardDefinitionIds: [selfDamageCard.id, BERSERK_ID, attackCard.id],
          },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [selfDamageCard.id, selfDamageCard],
        [BERSERK_ID, Berserk],
        [attackCard.id, attackCard],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 takes 75 self-damage → health 25
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

    // P1 plays Berserk
    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
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

    // P1 attacks — damage should be doubled (10 × 2 = 20)
    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:3" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[1].health).toBe(80);
  });

  it("blocks restricted cards while Berserk is active", () => {
    const recoverCard: CardDefinition = {
      id: "recover" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.Self },
          effects: [{ type: EffectType.Heal, amount: 5 }],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: { ...playerOne, maxHealth: 100 },
          loadout: {
            cardDefinitionIds: [selfDamageCard.id, BERSERK_ID, recoverCard.id],
          },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [selfDamageCard.id, selfDamageCard],
        [BERSERK_ID, Berserk],
        [recoverCard.id, recoverCard],
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

    // P1 plays Berserk
    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
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

    // P1 tries to play Recover — should be blocked by Berserk restriction
    expect(() =>
      engine.executeAction(
        state,
        useCard(playerOne.id, "player-1:3" as CardInstanceId),
        definition,
      ),
    ).toThrow();
  });

  it("applies Exhausted for 1 turn after Berserk expires", () => {
    const definition = {
      combatants: [
        {
          combatant: { ...playerOne, maxHealth: 100 },
          loadout: {
            cardDefinitionIds: [selfDamageCard.id, BERSERK_ID, attackCard.id],
          },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [selfDamageCard.id, selfDamageCard],
        [BERSERK_ID, Berserk],
        [attackCard.id, attackCard],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 self-damage to go below 30
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

    // P1 plays Berserk (turn N)
    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
      definition,
    ).state;

    // Advance 3 full cycles (turn N, N+1, N+2 for P1 → Berserk expires at start of N+3)
    for (let i = 0; i < 3; i++) {
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

    // Berserk has expired, Exhausted should be active
    const p1Statuses = state.combatants[0].statuses;
    expect(p1Statuses.some((s) => s.type === StatusType.Berserk)).toBe(false);
    expect(p1Statuses.some((s) => s.type === StatusType.Exhausted)).toBe(true);

    // P1 tries to play attack — Exhausted blocks all card play
    expect(() =>
      engine.executeAction(
        state,
        useCard(playerOne.id, "player-1:3" as CardInstanceId),
        definition,
      ),
    ).toThrow();
  });

  it("Exhausted expires after 1 turn and play resumes normally", () => {
    const definition = {
      combatants: [
        {
          combatant: { ...playerOne, maxHealth: 100 },
          loadout: {
            cardDefinitionIds: [selfDamageCard.id, BERSERK_ID, attackCard.id],
          },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [selfDamageCard.id, selfDamageCard],
        [BERSERK_ID, Berserk],
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
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
      definition,
    ).state;

    // 3 full cycles: Berserk expires, Exhausted starts
    for (let i = 0; i < 3; i++) {
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

    // Exhausted active — P1 must EndTurn
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

    // Now Exhausted expired — P1 can attack
    expect(
      state.combatants[0].statuses.some((s) => s.type === StatusType.Exhausted),
    ).toBe(false);
    expect(() =>
      engine.executeAction(
        state,
        useCard(playerOne.id, "player-1:3" as CardInstanceId),
        definition,
      ),
    ).not.toThrow();
  });
});

describe("Opening restriction (completing Feint)", () => {
  it("prevents Guard use while Opening is active", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [openingCard.id] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [inlineGuard.id] },
        },
      ],
      cardDefinitions: new Map([
        [openingCard.id, openingCard],
        [inlineGuard.id, inlineGuard],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 applies Opening to P2
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

    // P2 (with Opening) tries to play Guard — should be blocked
    expect(() =>
      engine.executeAction(
        state,
        useCard(playerTwo.id, "player-2:1" as CardInstanceId),
        definition,
      ),
    ).toThrow();
  });

  it("prevents Parry use while Opening is active", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [openingCard.id] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [PARRY_ID] },
        },
      ],
      cardDefinitions: new Map([
        [openingCard.id, openingCard],
        [PARRY_ID, Parry],
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

    expect(() =>
      engine.executeAction(
        state,
        useCard(playerTwo.id, "player-2:1" as CardInstanceId),
        definition,
      ),
    ).toThrow();
  });

  it("Opening expires and Guard becomes usable again", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [openingCard.id] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [inlineGuard.id] },
        },
      ],
      cardDefinitions: new Map([
        [openingCard.id, openingCard],
        [inlineGuard.id, inlineGuard],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 applies Opening to P2 (duration:2)
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

    // Opening ticked to 1 when P2 became active. Opening still active.
    expect(
      state.combatants[1].statuses.some((s) => s.type === StatusType.Opening),
    ).toBe(true);

    // P2 passes (can't play Guard) → P1 passes → P2's second turn: Opening ticks (1→0), expires
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

    // P2 can now play Guard
    expect(() =>
      engine.executeAction(
        state,
        useCard(playerTwo.id, "player-2:1" as CardInstanceId),
        definition,
      ),
    ).not.toThrow();
  });
});

describe("Exploit", () => {
  it("requires the enemy to have Opening", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [EXPLOIT_ID] },
        },
        {
          combatant: { ...playerTwo, maxHealth: 20 },
          loadout: { cardDefinitionIds: [] },
        },
      ],
      cardDefinitions: new Map([[EXPLOIT_ID, Exploit]]),
    };

    // P2 starts at 20 health (≤25) but has no Opening
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(() =>
      createEngine().executeAction(
        state,
        useCard(playerOne.id, "player-1:1" as CardInstanceId),
        definition,
      ),
    ).toThrow();
  });

  it("requires the enemy health to be 25 or less", () => {
    const applyOpeningCard: CardDefinition = {
      id: "apply-opening" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [
            {
              type: EffectType.ApplyStatus,
              statusType: StatusType.Opening,
              duration: 2,
              amount: 0,
            },
          ],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [applyOpeningCard.id, EXPLOIT_ID] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [] },
        },
      ],
      cardDefinitions: new Map([
        [applyOpeningCard.id, applyOpeningCard],
        [EXPLOIT_ID, Exploit],
      ]),
    };

    // P2 starts at 100 health (>25) with Opening applied
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

    // P2 has Opening but health is 100 — Exploit blocked
    expect(() =>
      engine.executeAction(
        state,
        useCard(playerOne.id, "player-1:2" as CardInstanceId),
        definition,
      ),
    ).toThrow();
  });

  it("deals 35 damage when enemy has Opening and health is 25 or less", () => {
    const applyOpeningCard: CardDefinition = {
      id: "apply-opening" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [
            {
              type: EffectType.ApplyStatus,
              statusType: StatusType.Opening,
              duration: 2,
              amount: 0,
            },
          ],
        },
      ],
    };

    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [applyOpeningCard.id, EXPLOIT_ID] },
        },
        {
          combatant: { ...playerTwo, maxHealth: 25 },
          loadout: { cardDefinitionIds: [] },
        },
      ],
      cardDefinitions: new Map([
        [applyOpeningCard.id, applyOpeningCard],
        [EXPLOIT_ID, Exploit],
      ]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 applies Opening to P2 (who starts at 25 health)
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

    // P1 uses Exploit — P2 has Opening and health ≤ 25
    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[1].health).toBe(-10);
  });
});
