import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  createEngine,
  createGame,
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

describe("CooldownSystem", () => {
  it("reduces cooldowns at the start of the active player's turn", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 3,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.None },
          effects: [],
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
      maxHealth: 20,
    };

    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
    };

    const engine = createEngine();

    const state0 = createGame({ matchId: "match-1" as MatchId, definition });

    const useCard: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const { state: state1 } = engine.executeAction(state0, useCard, definition);

    expect(state1.combatants[0].cards[0].remainingCooldown).toBe(3);

    const endTurn1: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne.id,
    };

    const { state: state2 } = engine.executeAction(
      state1,
      endTurn1,
      definition,
    );

    expect(state2.turn.activeCombatantId).toBe(playerTwo.id);

    expect(state2.combatants[0].cards[0].remainingCooldown).toBe(3);

    const endTurn2: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerTwo.id,
    };

    const { state: state3 } = engine.executeAction(
      state2,
      endTurn2,
      definition,
    );

    expect(state3.turn.activeCombatantId).toBe(playerOne.id);

    expect(state3.combatants[0].cards[0].remainingCooldown).toBe(2);
  });

  it("does not reduce cooldowns below zero", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 2,
      abilities: [
        {
          trigger: AbilityTrigger.OnUse,
          targeting: { type: TargetingType.None },
          effects: [],
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
      maxHealth: 20,
    };

    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [cardA.id] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
    };

    const engine = createEngine();

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(state.combatants[1].cards[0].remainingCooldown).toBe(0);

    const endTurn: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne.id,
    };

    const { state: result } = engine.executeAction(state, endTurn, definition);

    expect(result.combatants[1].cards[0].remainingCooldown).toBe(0);
  });
});
