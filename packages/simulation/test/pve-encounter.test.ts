import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  BASIC_STRIKE_ID,
  BasicStrike,
  createEngine,
  createGame,
  EffectType,
  EventType,
  GOBLIN_RAIDER_ID,
  GoblinRaider,
  GoblinRaiderMatchPlayer,
  MatchStatus,
  TargetingType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type EndTurnAction,
  type MatchEndedEvent,
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

const attackCard: CardDefinition = {
  id: "player-attack" as CardDefinitionId,
  cooldown: 0,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [{ type: EffectType.Damage, amount: 5 }],
    },
  ],
};

const definition = {
  players: [
    { player: playerOne, loadout: { cardDefinitionIds: [attackCard.id] } },
    GoblinRaiderMatchPlayer,
  ],
  cardDefinitions: new Map([
    [attackCard.id, attackCard],
    [BASIC_STRIKE_ID, BasicStrike],
  ]),
};

const endTurn = (actorId: PlayerId): EndTurnAction => ({
  type: ActionType.EndTurn,
  actorId,
});

const useCard = (
  actorId: PlayerId,
  cardInstanceId: CardInstanceId,
): UseCardAction => ({
  type: ActionType.UseCard,
  actorId,
  cardInstanceId,
});

describe("PvE initialization", () => {
  it("enemy initializes with correct health", () => {
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(state.players[1].health).toBe(GoblinRaider.maxHealth);
  });

  it("enemy initializes with the authored number of cards", () => {
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(state.players[1].cards).toHaveLength(1);
  });

  it("enemy cards initialize ready to use", () => {
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(state.players[1].cards[0].remainingCooldown).toBe(0);
  });

  it("enemy is assigned the correct identity", () => {
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    expect(state.players[1].player.id).toBe(GOBLIN_RAIDER_ID);
  });
});

describe("PvE combat", () => {
  it("player can deal damage to the enemy", () => {
    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });

    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(result.state.players[1].health).toBe(10);
  });

  it("enemy can deal damage to the player", () => {
    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    const result = engine.executeAction(
      state,
      useCard(GOBLIN_RAIDER_ID, "goblin-raider:1" as CardInstanceId),
      definition,
    );

    expect(result.state.players[0].health).toBe(14);
  });

  it("enemy card enters cooldown after use", () => {
    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    const result = engine.executeAction(
      state,
      useCard(GOBLIN_RAIDER_ID, "goblin-raider:1" as CardInstanceId),
      definition,
    );

    expect(result.state.players[1].cards[0].remainingCooldown).toBe(1);
  });

  it("enemy card cooldown decrements at the start of the enemy's next turn", () => {
    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    state = engine.executeAction(
      state,
      useCard(GOBLIN_RAIDER_ID, "goblin-raider:1" as CardInstanceId),
      definition,
    ).state;

    state = engine.executeAction(
      state,
      endTurn(GOBLIN_RAIDER_ID),
      definition,
    ).state;

    // Cooldown is still 1 — it decrements at the start of the enemy's next turn
    expect(state.players[1].cards[0].remainingCooldown).toBe(1);

    // PlayerOne EndTurns, starting the goblin's next turn — cooldown decrements
    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    expect(state.players[1].cards[0].remainingCooldown).toBe(0);
  });
});

describe("PvE match resolution", () => {
  it("match ends when the enemy is defeated", () => {
    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });

    // Three attacks of 5 damage each defeat the 15-HP goblin raider
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
      endTurn(GOBLIN_RAIDER_ID),
      definition,
    ).state;
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
      endTurn(GOBLIN_RAIDER_ID),
      definition,
    ).state;
    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(result.state.status).toBe(MatchStatus.Completed);
    expect(result.state.players[1].health).toBeLessThanOrEqual(0);
  });

  it("match ends when the player is defeated", () => {
    const fragilePlayer: Player = {
      id: "fragile-player" as PlayerId,
      team: Team.One,
      maxHealth: 6,
    };

    const pveDefinition = {
      players: [
        { player: fragilePlayer, loadout: { cardDefinitionIds: [] } },
        GoblinRaiderMatchPlayer,
      ],
      cardDefinitions: new Map([[BASIC_STRIKE_ID, BasicStrike]]),
    };

    const engine = createEngine();
    let state = createGame({
      matchId: "match-1" as MatchId,
      definition: pveDefinition,
    });

    state = engine.executeAction(
      state,
      endTurn("fragile-player" as PlayerId),
      pveDefinition,
    ).state;

    const result = engine.executeAction(
      state,
      useCard(GOBLIN_RAIDER_ID, "goblin-raider:1" as CardInstanceId),
      pveDefinition,
    );

    expect(result.state.status).toBe(MatchStatus.Completed);
    expect(result.state.players[0].health).toBeLessThanOrEqual(0);
  });

  it("the surviving combatant is recorded as the winner", () => {
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
      endTurn(GOBLIN_RAIDER_ID),
      definition,
    ).state;
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
      endTurn(GOBLIN_RAIDER_ID),
      definition,
    ).state;
    const result = engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    const matchEndedEvent = result.events.find(
      (e): e is MatchEndedEvent => e.type === EventType.MatchEnded,
    );

    expect(matchEndedEvent).toBeDefined();
    expect(matchEndedEvent!.winnerId).toBe(playerOne.id);
  });
});

describe("Determinism", () => {
  it("produces identical initial states from the same match definition", () => {
    const stateA = createGame({ matchId: "match-1" as MatchId, definition });
    const stateB = createGame({ matchId: "match-1" as MatchId, definition });

    expect(stateA).toStrictEqual(stateB);
  });

  it("produces identical results from the same state and actions", () => {
    const engine = createEngine();
    const stateA = createGame({ matchId: "match-1" as MatchId, definition });
    const stateB = createGame({ matchId: "match-1" as MatchId, definition });

    const resultA = engine.executeAction(
      stateA,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );
    const resultB = engine.executeAction(
      stateB,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(resultA.state).toStrictEqual(resultB.state);
    expect(resultA.events).toStrictEqual(resultB.events);
  });
});

describe("Replay compatibility", () => {
  it("produces the same result when replaying actions from the initial state", () => {
    const engine = createEngine();
    const initial = createGame({ matchId: "match-1" as MatchId, definition });

    const actions = [
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      endTurn(playerOne.id),
      useCard(GOBLIN_RAIDER_ID, "goblin-raider:1" as CardInstanceId),
      endTurn(GOBLIN_RAIDER_ID),
    ];

    let stateA = initial;
    for (const action of actions) {
      stateA = engine.executeAction(stateA, action, definition).state;
    }

    let stateB = initial;
    for (const action of actions) {
      stateB = engine.executeAction(stateB, action, definition).state;
    }

    expect(stateA).toStrictEqual(stateB);
  });
});

describe("Immutability", () => {
  it("does not mutate the state passed to executeAction", () => {
    const engine = createEngine();
    const state = createGame({ matchId: "match-1" as MatchId, definition });
    const originalGoblinHealth = state.players[1].health;

    engine.executeAction(
      state,
      useCard(playerOne.id, "player-1:1" as CardInstanceId),
      definition,
    );

    expect(state.players[1].health).toBe(originalGoblinHealth);
  });

  it("does not mutate enemy card state between actions", () => {
    const engine = createEngine();
    let state = createGame({ matchId: "match-1" as MatchId, definition });
    state = engine.executeAction(
      state,
      endTurn(playerOne.id),
      definition,
    ).state;

    const snapshot = state.players[1].cards[0].remainingCooldown;

    engine.executeAction(
      state,
      useCard(GOBLIN_RAIDER_ID, "goblin-raider:1" as CardInstanceId),
      definition,
    );

    expect(state.players[1].cards[0].remainingCooldown).toBe(snapshot);
  });
});
