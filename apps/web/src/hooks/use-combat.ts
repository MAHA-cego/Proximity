"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ActionType,
  CombatantControlType,
  MatchStatus,
  createEngine,
  type CardInstanceId,
  type GameEvent,
  type GameState,
  type MatchDefinition,
  type MatchId,
} from "@proximity/simulation";
import type { AiAgent } from "@proximity/ai";

interface CombatState {
  readonly snapshot: GameState;
  readonly playerPhaseEvents: readonly GameEvent[];
  readonly aiPhaseEvents: readonly GameEvent[];
}

export interface CombatControls {
  readonly snapshot: GameState;
  readonly playerPhaseEvents: readonly GameEvent[];
  readonly aiPhaseEvents: readonly GameEvent[];
  readonly playCard: (cardInstanceId: CardInstanceId) => void;
  readonly canPlayCard: (cardInstanceId: CardInstanceId) => boolean;
  readonly reset: () => void;
}

export function useCombat(
  encounterId: string,
  definition: MatchDefinition,
  agent: AiAgent,
): CombatControls {
  const engine = useMemo(() => createEngine(), []);

  const [state, setState] = useState<CombatState>(() => ({
    snapshot: engine.initializeGame(
      `${encounterId}-${Date.now()}` as MatchId,
      definition,
    ),
    playerPhaseEvents: [],
    aiPhaseEvents: [],
  }));

  const playCard = useCallback(
    (cardInstanceId: CardInstanceId) => {
      setState((prev) => {
        if (prev.snapshot.status !== MatchStatus.InProgress) return prev;

        let snapshot = prev.snapshot;
        const playerEvents: GameEvent[] = [];
        const aiEvents: GameEvent[] = [];
        const actorId = snapshot.turn.activeCombatantId;

        // Player plays their chosen card.
        const useResult = engine.executeAction(
          snapshot,
          { type: ActionType.UseCard, actorId, cardInstanceId },
          definition,
        );
        playerEvents.push(...useResult.events);
        snapshot = useResult.state;

        if (snapshot.status === MatchStatus.Completed) {
          return {
            snapshot,
            playerPhaseEvents: playerEvents,
            aiPhaseEvents: aiEvents,
          };
        }

        // Player ends their turn.
        const playerEndResult = engine.executeAction(
          snapshot,
          { type: ActionType.EndTurn, actorId },
          definition,
        );
        playerEvents.push(...playerEndResult.events);
        snapshot = playerEndResult.state;

        // Drive all AI turns until a human turn begins or the match ends.
        while (snapshot.status === MatchStatus.InProgress) {
          const activeCs = snapshot.combatants.find(
            (cs) => cs.combatant.id === snapshot.turn.activeCombatantId,
          );
          if (activeCs?.combatant.controlType !== CombatantControlType.AI)
            break;

          const aiActorId = snapshot.turn.activeCombatantId;
          const aiAction = agent.selectAction(snapshot, definition);

          const aiResult = engine.executeAction(snapshot, aiAction, definition);
          aiEvents.push(...aiResult.events);
          snapshot = aiResult.state;

          if (snapshot.status === MatchStatus.Completed) break;

          // If the AI played a card, end its turn.
          if (aiAction.type === ActionType.UseCard) {
            const aiEndResult = engine.executeAction(
              snapshot,
              { type: ActionType.EndTurn, actorId: aiActorId },
              definition,
            );
            aiEvents.push(...aiEndResult.events);
            snapshot = aiEndResult.state;
          }
        }

        return {
          snapshot,
          playerPhaseEvents: playerEvents,
          aiPhaseEvents: aiEvents,
        };
      });
    },
    [engine, definition, agent],
  );

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

  const reset = useCallback(() => {
    setState({
      snapshot: engine.initializeGame(
        `${encounterId}-${Date.now()}` as MatchId,
        definition,
      ),
      playerPhaseEvents: [],
      aiPhaseEvents: [],
    });
  }, [engine, encounterId, definition]);

  return {
    snapshot: state.snapshot,
    playerPhaseEvents: state.playerPhaseEvents,
    aiPhaseEvents: state.aiPhaseEvents,
    playCard,
    canPlayCard,
    reset,
  };
}
