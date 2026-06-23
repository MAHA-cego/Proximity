"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ActionType,
  MatchStatus,
  createEngine,
  type CardInstanceId,
  type GameEvent,
  type GameState,
  type MatchDefinition,
  type MatchId,
} from "@proximity/simulation";
import type { MatchParticipant } from "@/lib/simulation/match-factory";

interface CombatState {
  readonly snapshot: GameState;
  readonly localPhaseEvents: readonly GameEvent[];
  readonly automatedPhaseEvents: readonly GameEvent[];
}

export interface CombatControls {
  readonly snapshot: GameState;
  readonly localPhaseEvents: readonly GameEvent[];
  readonly automatedPhaseEvents: readonly GameEvent[];
  readonly playCard: (cardInstanceId: CardInstanceId) => void;
  readonly canPlayCard: (cardInstanceId: CardInstanceId) => boolean;
  readonly endTurn: () => void;
}

function getProvider(
  state: GameState,
  participants: readonly [MatchParticipant, MatchParticipant],
): MatchParticipant["provider"] {
  const activeId = state.turn.activeCombatantId;
  const participant = participants.find((p) => p.combatant.id === activeId);
  return participant?.provider ?? { type: "human" };
}

// Drive all automated turns until a human turn begins or the match ends.
function driveAutomatedTurns(
  initial: GameState,
  participants: readonly [MatchParticipant, MatchParticipant],
  definition: MatchDefinition,
  engine: ReturnType<typeof createEngine>,
  events: GameEvent[],
): GameState {
  let snapshot = initial;
  while (snapshot.status === MatchStatus.InProgress) {
    const provider = getProvider(snapshot, participants);
    if (provider.type !== "ai") break;

    const actorId = snapshot.turn.activeCombatantId;
    const action = provider.agent.selectAction(snapshot, definition);

    const result = engine.executeAction(snapshot, action, definition);
    events.push(...result.events);
    snapshot = result.state;

    if (snapshot.status === MatchStatus.Completed) break;

    if (action.type === ActionType.UseCard) {
      const endResult = engine.executeAction(
        snapshot,
        { type: ActionType.EndTurn, actorId },
        definition,
      );
      events.push(...endResult.events);
      snapshot = endResult.state;
    }
  }
  return snapshot;
}

export function useCombat(
  encounterId: string,
  definition: MatchDefinition,
  participants: readonly [MatchParticipant, MatchParticipant],
): CombatControls {
  const engine = useMemo(() => createEngine(), []);

  const [state, setState] = useState<CombatState>(() => ({
    snapshot: engine.initializeGame(
      `${encounterId}-${Date.now()}` as MatchId,
      definition,
    ),
    localPhaseEvents: [],
    automatedPhaseEvents: [],
  }));

  const playCard = useCallback(
    (cardInstanceId: CardInstanceId) => {
      setState((prev) => {
        if (prev.snapshot.status !== MatchStatus.InProgress) return prev;

        let snapshot = prev.snapshot;
        const localEvents: GameEvent[] = [];
        const automatedEvents: GameEvent[] = [];
        const actorId = snapshot.turn.activeCombatantId;

        if (
          !engine.canExecuteAction(
            snapshot,
            { type: ActionType.UseCard, actorId, cardInstanceId },
            definition,
          )
        ) {
          return prev;
        }

        const useResult = engine.executeAction(
          snapshot,
          { type: ActionType.UseCard, actorId, cardInstanceId },
          definition,
        );
        localEvents.push(...useResult.events);
        snapshot = useResult.state;

        if (snapshot.status === MatchStatus.Completed) {
          return {
            snapshot,
            localPhaseEvents: localEvents,
            automatedPhaseEvents: automatedEvents,
          };
        }

        const endResult = engine.executeAction(
          snapshot,
          { type: ActionType.EndTurn, actorId },
          definition,
        );
        localEvents.push(...endResult.events);
        snapshot = endResult.state;

        snapshot = driveAutomatedTurns(
          snapshot,
          participants,
          definition,
          engine,
          automatedEvents,
        );

        return {
          snapshot,
          localPhaseEvents: localEvents,
          automatedPhaseEvents: automatedEvents,
        };
      });
    },
    [engine, definition, participants],
  );

  const endTurn = useCallback(() => {
    setState((prev) => {
      if (prev.snapshot.status !== MatchStatus.InProgress) return prev;

      let snapshot = prev.snapshot;
      const localEvents: GameEvent[] = [];
      const automatedEvents: GameEvent[] = [];
      const actorId = snapshot.turn.activeCombatantId;

      const endResult = engine.executeAction(
        snapshot,
        { type: ActionType.EndTurn, actorId },
        definition,
      );
      localEvents.push(...endResult.events);
      snapshot = endResult.state;

      snapshot = driveAutomatedTurns(
        snapshot,
        participants,
        definition,
        engine,
        automatedEvents,
      );

      return {
        snapshot,
        localPhaseEvents: localEvents,
        automatedPhaseEvents: automatedEvents,
      };
    });
  }, [engine, definition, participants]);

  const canPlayCard = useCallback(
    (cardInstanceId: CardInstanceId): boolean => {
      return engine.canExecuteAction(
        state.snapshot,
        {
          type: ActionType.UseCard,
          actorId: state.snapshot.turn.activeCombatantId,
          cardInstanceId,
        },
        definition,
      );
    },
    [engine, state.snapshot, definition],
  );

  return {
    snapshot: state.snapshot,
    localPhaseEvents: state.localPhaseEvents,
    automatedPhaseEvents: state.automatedPhaseEvents,
    playCard,
    canPlayCard,
    endTurn,
  };
}
