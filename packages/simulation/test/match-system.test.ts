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
  type ConcedeAction,
  type MatchId,
  type Player,
  type PlayerId,
  type UseCardAction,
} from "../src";

describe("MatchSystem", () => {
  it("ends the match when a player concedes", () => {
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
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    const playerOne: Player = {
      id: "player-1" as PlayerId,
      team: Team.One,
      maxHealth: 20,
    };

    const playerTwo: Player = {
      id: "player-2" as PlayerId,
      team: Team.Two,
      maxHealth: 5,
    };

    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
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
        type: EventType.MatchEnded,
        winnerId: playerOne.id,
        loserId: playerTwo.id,
      },
    ]);

    expect(state.status).toBe(MatchStatus.InProgress);
  });
});
