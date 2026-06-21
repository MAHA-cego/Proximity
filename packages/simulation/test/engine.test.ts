import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  createEngine,
  createGame,
  EffectType,
  EventType,
  TargetingType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CombatantDefinition,
  type CombatantId,
  type EndTurnAction,
  type MatchId,
} from "../src";

describe("Engine", () => {
  it("advances the turn", () => {
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

    const action: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne.id,
    };

    const engine = createEngine();

    const result = engine.executeAction(state, action, definition);

    expect(result.state.turn.number).toBe(2);

    expect(result.state.turn.activeCombatantId).toBe(playerTwo.id);

    expect(result.events).toEqual([
      {
        type: EventType.TurnEnded,
        combatantId: playerOne.id,
      },
    ]);

    expect(state.turn.number).toBe(1);
    expect(state.turn.activeCombatantId).toBe(playerOne.id);
  });

  it("applies passive abilities during initialization", () => {
    const passive: CardDefinition = {
      id: "passive" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.Passive,
          targeting: { type: TargetingType.Self },
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
      maxHealth: 20,
    };

    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [passive.id] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[passive.id, passive]]),
    };

    const state = createEngine().initializeGame(
      "match-1" as MatchId,
      definition,
    );

    expect(state.combatants[0].health).toBe(15);
    expect(state.combatants[1].health).toBe(20);
  });
});
