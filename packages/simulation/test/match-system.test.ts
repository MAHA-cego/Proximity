import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  createEngine,
  createGame,
  EffectType,
  EventType,
  MatchStatus,
  TargetingType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type CombatantDefinition,
  type CombatantId,
  type ConcedeAction,
  type MatchId,
  type UseCardAction,
} from "../src";

describe("MatchSystem", () => {
  it("ends the match when a player concedes", () => {
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

    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map(),
    };

    const state = createGame({
      matchId: "match-1" as MatchId,
      definition,
    });

    const action: ConcedeAction = {
      type: ActionType.Concede,
      actorId: playerOne.id,
    };

    const engine = createEngine();

    const result = engine.executeAction(state, action, definition);

    expect(result.state.status).toBe(MatchStatus.Completed);

    expect(result.events).toEqual([
      {
        type: EventType.PlayerConceded,
        combatantId: playerOne.id,
      },
      {
        type: EventType.MatchEnded,
        winnerId: playerTwo.id,
        loserId: playerOne.id,
      },
    ]);

    expect(state.status).toBe(MatchStatus.InProgress);
  });

  it("ends the match when a player's health reaches zero", () => {
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

    const playerOne: CombatantDefinition = {
      id: "player-1" as CombatantId,
      team: Team.One,
      maxHealth: 20,
    };

    const playerTwo: CombatantDefinition = {
      id: "player-2" as CombatantId,
      team: Team.Two,
      maxHealth: 5,
    };

    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    expect(result.state.status).toBe(MatchStatus.Completed);

    expect(result.events).toEqual([
      {
        type: EventType.CardPlayed,
        actorId: playerOne.id,
        cardDefinitionId: cardA.id,
      },
      {
        type: EventType.DamageDealt,
        sourceId: playerOne.id,
        targetId: playerTwo.id,
        amount: 5,
        cause: { kind: "card", cardId: cardA.id },
      },
      {
        type: EventType.CombatantDefeated,
        combatantId: playerTwo.id,
      },
      {
        type: EventType.MatchEnded,
        winnerId: playerOne.id,
        loserId: playerTwo.id,
      },
    ]);

    expect(state.status).toBe(MatchStatus.InProgress);
  });
});
