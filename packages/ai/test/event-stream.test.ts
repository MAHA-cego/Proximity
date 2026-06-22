import { describe, expect, it } from "vitest";

import {
  AbilityTrigger,
  ActionType,
  CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS,
  CorruptedShepherdsDog,
  CorruptedShepherdsDogLoadout,
  createEngine,
  createGame,
  EffectType,
  EventType,
  MatchStatus,
  TargetingType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CombatantDefinition,
  type CombatantId,
  type GameEvent,
  type MatchId,
} from "@proximity/simulation";

import { createBasicHeuristicAi, createCorruptedShepherdsDogAi } from "../src";

const PLAYER_ID = "player" as CombatantId;

const player: CombatantDefinition = {
  id: PLAYER_ID,
  team: Team.One,
  maxHealth: 200,
};

const playerStrike: CardDefinition = {
  id: "player-strike" as CardDefinitionId,
  cooldown: 1,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [{ type: EffectType.Damage, amount: 15 }],
    },
  ],
};

const definition = {
  combatants: [
    {
      combatant: player,
      loadout: { cardDefinitionIds: [playerStrike.id] },
    },
    {
      combatant: CorruptedShepherdsDog,
      loadout: CorruptedShepherdsDogLoadout,
    },
  ],
  cardDefinitions: new Map([
    [playerStrike.id, playerStrike],
    ...CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS,
  ]),
};

function runFullMatch(): { events: readonly GameEvent[]; turnCount: number } {
  const allEvents: GameEvent[] = [];
  const playerAi = createBasicHeuristicAi();
  const dogAi = createCorruptedShepherdsDogAi();
  const engine = createEngine();
  let state = createGame({ matchId: "m" as MatchId, definition });

  let i = 0;
  while (state.status === MatchStatus.InProgress && i < 400) {
    const isPlayerTurn = state.turn.activeCombatantId === PLAYER_ID;
    const ai = isPlayerTurn ? playerAi : dogAi;
    const action = ai.selectAction(state, definition);
    const result = engine.executeAction(state, action, definition);
    allEvents.push(...result.events);
    state = result.state;
    i++;
  }

  return { events: allEvents, turnCount: i };
}

describe("Full-match event stream", () => {
  it("terminates with MatchEnded as the final event", () => {
    const { events, turnCount } = runFullMatch();

    expect(turnCount).toBeLessThan(400);
    expect(events.at(-1)).toMatchObject({ type: EventType.MatchEnded });
  });

  it("emits no events after MatchEnded", () => {
    const { events } = runFullMatch();

    const lastMatchEndedIdx = events.findLastIndex(
      (e) => e.type === EventType.MatchEnded,
    );
    expect(lastMatchEndedIdx).toBe(events.length - 1);
  });

  it("emits CombatantDefeated immediately before MatchEnded", () => {
    const { events } = runFullMatch();

    const matchEndedIdx = events.findLastIndex(
      (e) => e.type === EventType.MatchEnded,
    );
    const defeatedIdx = events.findLastIndex(
      (e) => e.type === EventType.CombatantDefeated,
    );
    // Victory is by defeat, not concede — CombatantDefeated must immediately precede MatchEnded
    expect(defeatedIdx).toBe(matchEndedIdx - 1);
  });

  it("emits at least one CardPlayed event across the full match", () => {
    const { events } = runFullMatch();

    const cardPlayedCount = events.filter(
      (e) => e.type === EventType.CardPlayed,
    ).length;

    expect(cardPlayedCount).toBeGreaterThan(0);
  });

  it("emits both CardPlayed and TurnEnded events across the full match", () => {
    const { events } = runFullMatch();

    // A realistic match always has card plays and turn transitions
    const cardPlayedCount = events.filter(
      (e) => e.type === EventType.CardPlayed,
    ).length;
    const turnEndedCount = events.filter(
      (e) => e.type === EventType.TurnEnded,
    ).length;

    expect(cardPlayedCount).toBeGreaterThan(0);
    expect(turnEndedCount).toBeGreaterThan(0);
  });

  it("emits DamageDealt events with amounts greater than zero", () => {
    const { events } = runFullMatch();

    const damageEvents = events.filter((e) => e.type === EventType.DamageDealt);
    expect(damageEvents.length).toBeGreaterThan(0);
    for (const event of damageEvents) {
      expect(event).toMatchObject({ type: EventType.DamageDealt });
      // Verify positive amounts — toMatchObject allows partial matching
      if (event.type === EventType.DamageDealt) {
        expect(event.amount).toBeGreaterThan(0);
      }
    }
  });

  it("produces an identical event stream across identical replays", () => {
    const { events: runA } = runFullMatch();
    const { events: runB } = runFullMatch();

    expect(runA).toStrictEqual(runB);
  });
});
