import { describe, expect, it } from "vitest";

import {
  ActionType,
  createEngine,
  createGame,
  LACERATION_ID,
  Laceration,
  RECOVER_ID,
  Recover,
  StatusType,
  Team,
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

describe("Laceration", () => {
  it("deals 4 damage and applies Bleeding to the enemy", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [LACERATION_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[LACERATION_ID, Laceration]]),
    };

    const state = createGame({ matchId: "match-1" as MatchId, definition });
    const result = createEngine().executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[1].health).toBe(96);
    expect(result.state.combatants[1].statuses).toHaveLength(1);
    expect(result.state.combatants[1].statuses[0]).toStrictEqual({
      type: StatusType.Bleeding,
      remainingDuration: 5,
      amount: 3,
    });
  });

  it("deals 3 Bleeding damage at the start of the bleeding player's turn", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [LACERATION_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[LACERATION_ID, Laceration]]),
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

    expect(state.combatants[1].health).toBe(93);
    expect(state.combatants[1].statuses[0].remainingDuration).toBe(4);
  });

  it("Bleeding stacks — multiple applications tick independently", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [LACERATION_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[LACERATION_ID, Laceration]]),
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
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    expect(state.combatants[1].statuses).toHaveLength(2);
    expect(state.combatants[1].health).toBe(86);
  });

  it("Bleeding does not tick on the non-bleeding player's turn", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [LACERATION_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[LACERATION_ID, Laceration]]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    expect(state.combatants[1].health).toBe(96);
  });

  it("Bleeding ticks five times and then expires", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [LACERATION_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[LACERATION_ID, Laceration]]),
    };

    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    ).state;

    for (let i = 0; i < 5; i++) {
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

    expect(state.combatants[1].health).toBe(81);
    expect(state.combatants[1].statuses).toHaveLength(0);
  });
});

describe("Recover", () => {
  it("restores 10 health to self", () => {
    const definition = {
      combatants: [
        { combatant: playerOne, loadout: { cardDefinitionIds: [RECOVER_ID] } },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[RECOVER_ID, Recover]]),
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
      endTurn(playerTwo.id),
      definition,
    ).state;

    const damagedState = {
      ...state,
      combatants: [{ ...state.combatants[0], health: 80 }, state.combatants[1]],
    };

    const result = engine.executeAction(
      damagedState,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[0].health).toBe(90);
  });

  it("removes all Bleeding from self", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [LACERATION_ID, RECOVER_ID] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [LACERATION_ID] },
        },
      ],
      cardDefinitions: new Map([
        [LACERATION_ID, Laceration],
        [RECOVER_ID, Recover],
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

    expect(state.combatants[0].statuses).toHaveLength(1);
    expect(state.combatants[0].statuses[0].type).toBe(StatusType.Bleeding);

    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[0].statuses).toHaveLength(0);
  });

  it("removes all stacked Bleeding at once", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [LACERATION_ID, RECOVER_ID] },
        },
        {
          combatant: playerTwo,
          loadout: { cardDefinitionIds: [LACERATION_ID] },
        },
      ],
      cardDefinitions: new Map([
        [LACERATION_ID, Laceration],
        [RECOVER_ID, Recover],
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

    expect(state.combatants[0].statuses).toHaveLength(2);

    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[0].statuses).toHaveLength(0);
  });

  it("does not remove Bleeding from the enemy", () => {
    const definition = {
      combatants: [
        {
          combatant: playerOne,
          loadout: { cardDefinitionIds: [LACERATION_ID, RECOVER_ID] },
        },
        { combatant: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [LACERATION_ID, Laceration],
        [RECOVER_ID, Recover],
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

    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:2" as CardInstanceId),
      definition,
    );

    expect(result.state.combatants[1].statuses).toHaveLength(1);
    expect(result.state.combatants[1].statuses[0].type).toBe(
      StatusType.Bleeding,
    );
  });
});
