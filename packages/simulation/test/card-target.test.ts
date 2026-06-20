import { describe, expect, it } from "vitest";

import {
  ActionType,
  BASIC_STRIKE_ID,
  BasicStrike,
  createEngine,
  createGame,
  Overload,
  OVERLOAD_ID,
  Recharge,
  RECHARGE_ID,
  Team,
  type CardInstanceId,
  type MatchId,
  type Player,
  type PlayerId,
  type UseCardAction,
} from "../src";

const playerOne: Player = {
  id: "player-1" as PlayerId,
  team: Team.One,
  maxHealth: 20,
};

const playerTwo: Player = {
  id: "player-2" as PlayerId,
  team: Team.Two,
  maxHealth: 20,
};

describe("Recharge", () => {
  it("resets Basic Strike cooldown to zero", () => {
    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [BASIC_STRIKE_ID, RECHARGE_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [BASIC_STRIKE_ID, BasicStrike],
        [RECHARGE_ID, Recharge],
      ]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const useStrike: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const state2 = engine.executeAction(state, useStrike, definition).state;

    expect(state2.players[0].cards[0].remainingCooldown).toBe(1);

    const useRecharge: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:2" as CardInstanceId,
    };

    const result = engine.executeAction(state2, useRecharge, definition);

    expect(result.state.players[0].cards[0].remainingCooldown).toBe(0);
  });

  it("does not affect player health", () => {
    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [BASIC_STRIKE_ID, RECHARGE_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [BASIC_STRIKE_ID, BasicStrike],
        [RECHARGE_ID, Recharge],
      ]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const useStrike: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const state2 = engine.executeAction(state, useStrike, definition).state;

    const useRecharge: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:2" as CardInstanceId,
    };

    const result = engine.executeAction(state2, useRecharge, definition);

    expect(result.state.players[0].health).toBe(20);
    expect(result.state.players[1].health).toBe(14);
  });
});

describe("Overload", () => {
  it("increases Basic Strike cooldown by 2", () => {
    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [BASIC_STRIKE_ID, OVERLOAD_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [BASIC_STRIKE_ID, BasicStrike],
        [OVERLOAD_ID, Overload],
      ]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(state.players[0].cards[0].remainingCooldown).toBe(0);

    const useOverload: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:2" as CardInstanceId,
    };

    const result = engine.executeAction(state, useOverload, definition);

    expect(result.state.players[0].cards[0].remainingCooldown).toBe(2);
  });

  it("stacks with existing cooldown", () => {
    const definition = {
      players: [
        {
          player: playerOne,
          loadout: { cardDefinitionIds: [BASIC_STRIKE_ID, OVERLOAD_ID] },
        },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
      ],
      cardDefinitions: new Map([
        [BASIC_STRIKE_ID, BasicStrike],
        [OVERLOAD_ID, Overload],
      ]),
    };

    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const useStrike: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:1" as CardInstanceId,
    };

    const state2 = engine.executeAction(state, useStrike, definition).state;

    expect(state2.players[0].cards[0].remainingCooldown).toBe(1);

    const useOverload: UseCardAction = {
      type: ActionType.UseCard,
      actorId: playerOne.id,
      cardInstanceId: "player-1:2" as CardInstanceId,
    };

    const result = engine.executeAction(state2, useOverload, definition);

    expect(result.state.players[0].cards[0].remainingCooldown).toBe(3);
  });
});
