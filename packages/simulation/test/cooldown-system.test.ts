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
  type EndTurnAction,
  type MatchId,
  type Player,
  type PlayerId,
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

    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    expect(state1.players[0].cards[0].remainingCooldown).toBe(3);

    const endTurn1: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne.id,
    };

    const { state: state2 } = engine.executeAction(
      state1,
      endTurn1,
      definition,
    );

    expect(state2.turn.activePlayerId).toBe(playerTwo.id);

    expect(state2.players[0].cards[0].remainingCooldown).toBe(3);

    const endTurn2: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerTwo.id,
    };

    const { state: state3 } = engine.executeAction(
      state2,
      endTurn2,
      definition,
    );

    expect(state3.turn.activePlayerId).toBe(playerOne.id);

    expect(state3.players[0].cards[0].remainingCooldown).toBe(2);
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

    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [cardA.id] } },
      ],
      cardDefinitions: new Map([[cardA.id, cardA]]),
    };

    const engine = createEngine();

    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(state.players[1].cards[0].remainingCooldown).toBe(0);

    const endTurn: EndTurnAction = {
      type: ActionType.EndTurn,
      actorId: playerOne.id,
    };

    const { state: result } = engine.executeAction(state, endTurn, definition);

    expect(result.players[1].cards[0].remainingCooldown).toBe(0);
  });
});
