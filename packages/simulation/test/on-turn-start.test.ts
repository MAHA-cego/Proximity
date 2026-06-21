import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  createEngine,
  createGame,
  EffectType,
  TargetingType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CombatantDefinition,
  type CombatantId,
  type EndTurnAction,
  type MatchId,
} from "../src";

describe("OnTurnStart dispatch", () => {
  it("fires abilities for the player whose turn is starting", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnTurnStart,
          targeting: { type: TargetingType.Self },
          effects: [{ type: EffectType.Damage, amount: 3 }],
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

    const endTurn: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne.id,
    };

    const result = createEngine().executeAction(state, endTurn, definition);

    expect(result.state.combatants[1].health).toBe(17);
    expect(result.state.combatants[0].health).toBe(20);
    expect(state.combatants[1].health).toBe(20);
  });

  it("does not fire abilities for the player ending their turn", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnTurnStart,
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
        { combatant: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const endTurn: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne.id,
    };

    const result = createEngine().executeAction(state, endTurn, definition);

    expect(result.state.combatants[0].health).toBe(20);
  });
});

describe("Burn", () => {
  it("deals damage to the owner at the start of their turn", () => {
    const burn: CardDefinition = {
      id: "burn" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnTurnStart,
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
        { combatant: playerOne, loadout: { cardDefinitionIds: [] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [burn.id] } },
      ],
      cardDefinitions: new Map([[burn.id, burn]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const endTurn: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne.id,
    };

    const result = createEngine().executeAction(state, endTurn, definition);

    expect(result.state.combatants[1].health).toBe(15);
    expect(result.state.combatants[0].health).toBe(20);
  });
});

describe("Regeneration", () => {
  it("restores health to the owner at the start of their turn", () => {
    const regen: CardDefinition = {
      id: "regen" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnTurnStart,
          targeting: { type: TargetingType.Self },
          effects: [
            { type: EffectType.Damage, amount: 10 },
            { type: EffectType.Heal, amount: 4 },
          ],
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
        { combatant: playerTwo, loadout: { cardDefinitionIds: [regen.id] } },
      ],
      cardDefinitions: new Map([[regen.id, regen]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const endTurn: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne.id,
    };

    const result = createEngine().executeAction(state, endTurn, definition);

    expect(result.state.combatants[1].health).toBe(14);
  });
});

describe("Multiple persistent abilities", () => {
  it("executes all OnTurnStart abilities on a card in authored order", () => {
    const card: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 0,
      abilities: [
        {
          trigger: AbilityTrigger.OnTurnStart,
          targeting: { type: TargetingType.Self },
          effects: [{ type: EffectType.Damage, amount: 3 }],
        },
        {
          trigger: AbilityTrigger.OnTurnStart,
          targeting: { type: TargetingType.SingleEnemy },
          effects: [{ type: EffectType.Damage, amount: 2 }],
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
        { combatant: playerTwo, loadout: { cardDefinitionIds: [card.id] } },
      ],
      cardDefinitions: new Map([[card.id, card]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const endTurn: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne.id,
    };

    const result = createEngine().executeAction(state, endTurn, definition);

    expect(result.state.combatants[1].health).toBe(17);
    expect(result.state.combatants[0].health).toBe(18);
  });
});
