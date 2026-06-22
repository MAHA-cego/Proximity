import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  createEngine,
  createGame,
  EffectType,
  EventType,
  LACERATION_ID,
  Laceration,
  StatusType,
  TargetingType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type CombatantDefinition,
  type CombatantId,
  type ConcedeAction,
  type EndTurnAction,
  type MatchId,
  type UseCardAction,
} from "../src";

const p1: CombatantDefinition = {
  id: "player-1" as CombatantId,
  team: Team.One,
  maxHealth: 100,
};

const p2: CombatantDefinition = {
  id: "player-2" as CombatantId,
  team: Team.Two,
  maxHealth: 100,
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

describe("Event ordering — UseCard", () => {
  it("emits CardPlayed as the first event, followed by effect events, then match events", () => {
    const lethal: CardDefinition = {
      id: "lethal" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 100 }],
        },
      ],
    };
    const definition = {
      combatants: [
        { combatant: p1, loadout: { cardDefinitionIds: [lethal.id] } },
        { combatant: p2, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[lethal.id, lethal]]),
    };
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const { events } = createEngine().executeAction(
      state,
      useCard(p1.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(events).toEqual([
      {
        type: EventType.CardPlayed,
        actorId: p1.id,
        cardDefinitionId: lethal.id,
      },
      {
        type: EventType.DamageDealt,
        sourceId: p1.id,
        targetId: p2.id,
        amount: 100,
      },
      { type: EventType.CombatantDefeated, combatantId: p2.id },
      { type: EventType.MatchEnded, winnerId: p1.id, loserId: p2.id },
    ]);
  });

  it("emits DamageDealt before StatusApplied when effects are declared in that order", () => {
    // Laceration: deals 4 damage then applies Bleeding
    const definition = {
      combatants: [
        { combatant: p1, loadout: { cardDefinitionIds: [LACERATION_ID] } },
        { combatant: p2, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[LACERATION_ID, Laceration]]),
    };
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const { events } = createEngine().executeAction(
      state,
      useCard(p1.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(events[0]).toMatchObject({ type: EventType.CardPlayed });
    expect(events[1]).toMatchObject({
      type: EventType.DamageDealt,
      targetId: p2.id,
    });
    expect(events[2]).toMatchObject({
      type: EventType.StatusApplied,
      targetId: p2.id,
      statusType: StatusType.Bleeding,
    });
  });

  it("emits CombatantDefeated immediately before MatchEnded", () => {
    const lethal: CardDefinition = {
      id: "lethal" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 100 }],
        },
      ],
    };
    const definition = {
      combatants: [
        { combatant: p1, loadout: { cardDefinitionIds: [lethal.id] } },
        { combatant: p2, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[lethal.id, lethal]]),
    };
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const { events } = createEngine().executeAction(
      state,
      useCard(p1.id, "player-1:1" as CardInstanceId),
      definition,
    );

    const defeatedIdx = events.findIndex(
      (e) => e.type === EventType.CombatantDefeated,
    );
    const endedIdx = events.findIndex((e) => e.type === EventType.MatchEnded);
    expect(defeatedIdx).toBeGreaterThan(-1);
    expect(endedIdx).toBe(defeatedIdx + 1);
  });

  it("emits PlayerConceded then MatchEnded on concede, without CombatantDefeated", () => {
    const definition = {
      combatants: [
        { combatant: p1, loadout: { cardDefinitionIds: [] } },
        { combatant: p2, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map(),
    };
    const state = createGame({ matchId: "match-1" as MatchId, definition });
    const concede: ConcedeAction = { type: ActionType.Concede, actorId: p1.id };

    const { events } = createEngine().executeAction(state, concede, definition);

    expect(events).toEqual([
      { type: EventType.PlayerConceded, combatantId: p1.id },
      { type: EventType.MatchEnded, winnerId: p2.id, loserId: p1.id },
    ]);
  });
});

describe("Event ordering — EndTurn", () => {
  it("emits TurnEnded as the first event", () => {
    const definition = {
      combatants: [
        { combatant: p1, loadout: { cardDefinitionIds: [] } },
        { combatant: p2, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map(),
    };
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const { events } = createEngine().executeAction(
      state,
      endTurn(p1.id),
      definition,
    );

    expect(events[0]).toMatchObject({
      type: EventType.TurnEnded,
      combatantId: p1.id,
    });
  });

  it("emits TurnEnded before status tick events", () => {
    const definition = {
      combatants: [
        { combatant: p1, loadout: { cardDefinitionIds: [LACERATION_ID] } },
        { combatant: p2, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[LACERATION_ID, Laceration]]),
    };
    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // P1 applies Bleeding to P2
    state = engine.executeAction(
      state,
      useCard(p1.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    // P1 ends turn — triggers P2's turn start, Bleeding ticks
    const { events } = engine.executeAction(state, endTurn(p1.id), definition);

    const turnEndedIdx = events.findIndex(
      (e) => e.type === EventType.TurnEnded,
    );
    const damageIdx = events.findIndex((e) => e.type === EventType.DamageDealt);
    expect(turnEndedIdx).toBe(0);
    expect(damageIdx).toBeGreaterThan(turnEndedIdx);
  });

  it("emits status tick events before OnTurnStart ability events", () => {
    // P2 has Bleeding and a card that deals damage on turn start
    const onTurnStartCard: CardDefinition = {
      id: "on-turn-start" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnTurnStart,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 2 }],
        },
      ],
    };
    const definition = {
      combatants: [
        { combatant: p1, loadout: { cardDefinitionIds: [] } },
        { combatant: p2, loadout: { cardDefinitionIds: [onTurnStartCard.id] } },
      ],
      cardDefinitions: new Map([[onTurnStartCard.id, onTurnStartCard]]),
    };
    const initialState = createGame({
      matchId: "match-1" as MatchId,
      definition,
    });

    // Inject Bleeding onto P2
    const stateWithBleeding = {
      ...initialState,
      combatants: [
        initialState.combatants[0],
        {
          ...initialState.combatants[1],
          statuses: [
            { type: StatusType.Bleeding, remainingDuration: 2, amount: 3 },
          ],
        },
      ],
    };

    // P1 ends turn — P2's turn starts: Bleeding tick (DamageDealt on P2), then OnTurnStart (DamageDealt on P1)
    const { events } = createEngine().executeAction(
      stateWithBleeding,
      endTurn(p1.id),
      definition,
    );

    // Bleeding tick: sourceId === targetId === p2 (self-damage)
    // OnTurnStart (SingleEnemy from p2): targetId === p1
    expect(events[0]).toMatchObject({ type: EventType.TurnEnded });
    expect(events[1]).toMatchObject({
      type: EventType.DamageDealt,
      targetId: p2.id,
    });
    expect(events[2]).toMatchObject({
      type: EventType.DamageDealt,
      targetId: p1.id,
    });
  });

  it("emits StatusRemoved after the final tick and before onExpiry effects", () => {
    const definition = {
      combatants: [
        { combatant: p1, loadout: { cardDefinitionIds: [] } },
        { combatant: p2, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map(),
    };
    const initialState = createGame({
      matchId: "match-1" as MatchId,
      definition,
    });

    // P2 has Bleeding at its final duration, with an onExpiry heal
    const stateWithExpiringBleeding = {
      ...initialState,
      combatants: [
        initialState.combatants[0],
        {
          ...initialState.combatants[1],
          health: 80,
          statuses: [
            {
              type: StatusType.Bleeding,
              remainingDuration: 1,
              amount: 3,
              onExpiry: [{ type: EffectType.Heal, amount: 5 }],
            },
          ],
        },
      ],
    };

    // P1 ends turn — P2's turn: Bleeding ticks (DamageDealt), Bleeding expires (StatusRemoved), onExpiry heals (HealingDone)
    const { events } = createEngine().executeAction(
      stateWithExpiringBleeding,
      endTurn(p1.id),
      definition,
    );

    const damageIdx = events.findIndex((e) => e.type === EventType.DamageDealt);
    const removedIdx = events.findIndex(
      (e) => e.type === EventType.StatusRemoved,
    );
    const healIdx = events.findIndex((e) => e.type === EventType.HealingDone);

    expect(damageIdx).toBeGreaterThan(-1);
    expect(removedIdx).toBeGreaterThan(damageIdx);
    expect(healIdx).toBeGreaterThan(removedIdx);
  });

  it("emits CombatantDefeated then MatchEnded when a status tick is lethal", () => {
    const definition = {
      combatants: [
        { combatant: p1, loadout: { cardDefinitionIds: [] } },
        { combatant: p2, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map(),
    };
    const initialState = createGame({
      matchId: "match-1" as MatchId,
      definition,
    });

    // P2 has 3 HP and Bleeding for 5 — the tick will kill P2
    const stateWithLethalBleeding = {
      ...initialState,
      combatants: [
        initialState.combatants[0],
        {
          ...initialState.combatants[1],
          health: 3,
          statuses: [
            { type: StatusType.Bleeding, remainingDuration: 2, amount: 5 },
          ],
        },
      ],
    };

    const { events } = createEngine().executeAction(
      stateWithLethalBleeding,
      endTurn(p1.id),
      definition,
    );

    expect(events).toEqual([
      { type: EventType.TurnEnded, combatantId: p1.id },
      {
        type: EventType.DamageDealt,
        sourceId: p2.id,
        targetId: p2.id,
        amount: 5,
      },
      { type: EventType.CombatantDefeated, combatantId: p2.id },
      { type: EventType.MatchEnded, winnerId: p1.id, loserId: p2.id },
    ]);
  });
});
