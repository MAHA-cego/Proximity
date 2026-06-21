import { describe, expect, it } from "vitest";

import {
  ActionType,
  BASIC_STRIKE_ID,
  BasicStrike,
  CombatantControlType,
  createEngine,
  createGame,
  GoblinRaider,
  GoblinRaiderMatchCombatant,
  MatchStatus,
  Team,
  type CombatantDefinition,
  type CombatantId,
  type MatchId,
} from "@proximity/simulation";

import { createBasicHeuristicAi } from "../src";

const playerOne: CombatantDefinition = {
  id: "player-1" as CombatantId,
  team: Team.One,
  maxHealth: 20,
  controlType: CombatantControlType.Human,
};

const definition = {
  combatants: [
    { combatant: playerOne, loadout: { cardDefinitionIds: [BASIC_STRIKE_ID] } },
    GoblinRaiderMatchCombatant,
  ],
  cardDefinitions: new Map([[BASIC_STRIKE_ID, BasicStrike]]),
};

describe("BasicHeuristicAi — action selection", () => {
  it("selects UseCard when a card has no cooldown", () => {
    const ai = createBasicHeuristicAi();
    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const afterEndTurn = engine.executeAction(
      state,
      { type: ActionType.EndTurn, actorId: playerOne.id },
      definition,
    ).state;

    const action = ai.selectAction(afterEndTurn, definition);

    expect(action.type).toBe(ActionType.UseCard);
    expect(action.actorId).toBe(GoblinRaider.id);
  });

  it("selects EndTurn when all cards are on cooldown", () => {
    const ai = createBasicHeuristicAi();
    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      { type: ActionType.EndTurn, actorId: playerOne.id },
      definition,
    ).state;

    const goblinCard = state.combatants[1].cards[0];
    state = engine.executeAction(
      state,
      {
        type: ActionType.UseCard,
        actorId: GoblinRaider.id,
        cardInstanceId: goblinCard.instanceId,
      },
      definition,
    ).state;

    const action = ai.selectAction(state, definition);

    expect(action.type).toBe(ActionType.EndTurn);
  });

  it("returns the same action from the same state", () => {
    const ai = createBasicHeuristicAi();
    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const afterEndTurn = engine.executeAction(
      state,
      { type: ActionType.EndTurn, actorId: playerOne.id },
      definition,
    ).state;

    const actionA = ai.selectAction(afterEndTurn, definition);
    const actionB = ai.selectAction(afterEndTurn, definition);

    expect(actionA).toStrictEqual(actionB);
  });

  it("skips cards that fail their requirements", () => {
    const ai = createBasicHeuristicAi();

    const definition2 = {
      combatants: [
        GoblinRaiderMatchCombatant,
        { combatant: playerOne, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([[BASIC_STRIKE_ID, BasicStrike]]),
    };

    const state = createGame({
      matchId: "match-1" as MatchId,
      definition: definition2,
    });
    const action = ai.selectAction(state, definition2);

    expect(action.type).toBe(ActionType.UseCard);
  });
});

describe("BasicHeuristicAi — full encounter", () => {
  it("runs a complete encounter to completion", () => {
    const ai = createBasicHeuristicAi();
    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    let iterations = 0;
    while (state.status === MatchStatus.InProgress && iterations < 100) {
      const action = ai.selectAction(state, definition);
      state = engine.executeAction(state, action, definition).state;
      iterations++;
    }

    expect(state.status).toBe(MatchStatus.Completed);
  });

  it("produces the same final state when replayed", () => {
    const run = () => {
      const ai = createBasicHeuristicAi();
      const engine = createEngine();
      let state = createGame({ matchId: "match-1" as MatchId, definition });
      let iterations = 0;
      while (state.status === MatchStatus.InProgress && iterations < 100) {
        const action = ai.selectAction(state, definition);
        state = engine.executeAction(state, action, definition).state;
        iterations++;
      }
      return state;
    };

    expect(run()).toStrictEqual(run());
  });
});
