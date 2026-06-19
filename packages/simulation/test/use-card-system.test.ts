import { describe, expect, it } from "vitest";

import {
  ActionType,
  createEngine,
  createGame,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type MatchId,
  type Player,
  type PlayerId,
  type UseCardAction,
} from "../src";

describe("UseCardSystem", () => {
  it("applies the card definition cooldown to the used card", () => {
    const cardA: CardDefinition = {
      id: "card-a" as CardDefinitionId,
      cooldown: 3,
    };

    const playerOne: Player = {
      id: "player-1" as PlayerId,
      team: Team.One,
    };

    const playerTwo: Player = {
      id: "player-2" as PlayerId,
      team: Team.Two,
    };

    const definition = {
      players: [
        { player: playerOne, loadout: { cardDefinitionIds: [cardA.id] } },
        { player: playerTwo, loadout: { cardDefinitionIds: [] } },
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

    expect(result.state.players[0].cards[0].remainingCooldown).toBe(3);

    expect(result.events).toEqual([]);

    expect(state.players[0].cards[0].remainingCooldown).toBe(0);
  });
});
