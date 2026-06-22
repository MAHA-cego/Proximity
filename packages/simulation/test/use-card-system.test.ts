import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  createEngine,
  createGame,
  EventType,
  IllegalActionError,
  InvalidActionError,
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

describe("UseCardSystem", () => {
  it("applies the card definition cooldown to the used card", () => {
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

    const state = createGame({
      matchId: "match-1" as MatchId,
      definition,
    });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const engine = createEngine();

    const result = engine.executeAction(state, action, definition);

    expect(result.state.combatants[0].cards[0].remainingCooldown).toBe(3);

    expect(result.events).toEqual([
      {
        type: EventType.CardPlayed,
        actorId: playerOne.id,
        cardDefinitionId: cardA.id,
      },
    ]);

    expect(state.combatants[0].cards[0].remainingCooldown).toBe(0);
  });

  it("throws if the actor is not the active player", () => {
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

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerTwo.id,
      cardInstanceId: "player-2:1" as CardInstanceId,
    };

    const engine = createEngine();

    expect(() => engine.executeAction(state, action, definition)).toThrow(
      IllegalActionError,
    );
  });

  it("throws if the card does not exist", () => {
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

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:99" as CardInstanceId,
    };

    const engine = createEngine();

    expect(() => engine.executeAction(state, action, definition)).toThrow(
      InvalidActionError,
    );
  });

  it("throws if the card is not owned by the actor", () => {
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

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-2:1" as CardInstanceId,
    };

    const engine = createEngine();

    expect(() => engine.executeAction(state, action, definition)).toThrow(
      InvalidActionError,
    );
  });

  it("throws if the card is on cooldown", () => {
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

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const action: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const engine = createEngine();

    const { state: stateAfterUse } = engine.executeAction(
      state,
      action,
      definition,
    );

    expect(() =>
      engine.executeAction(stateAfterUse, action, definition),
    ).toThrow(InvalidActionError);
  });
});
