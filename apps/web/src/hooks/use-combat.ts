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
  readonly lastEvents: readonly GameEvent[];
}

export interface CombatControls {
  readonly snapshot: GameState;
  readonly lastEvents: readonly GameEvent[];
  readonly playCard: (cardInstanceId: CardInstanceId) => void;
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
    lastEvents: [],
  }));

  const playCard = useCallback(
    (cardInstanceId: CardInstanceId) => {
      setState((prev) => {
        if (prev.snapshot.status !== MatchStatus.InProgress) return prev;

        let snapshot = prev.snapshot;
        const events: GameEvent[] = [];
        const actorId = snapshot.turn.activeCombatantId;

        // Player plays their chosen card.
        const useResult = engine.executeAction(
          snapshot,
          { type: ActionType.UseCard, actorId, cardInstanceId },
          definition,
        );
        events.push(...useResult.events);
        snapshot = useResult.state;

        if (snapshot.status === MatchStatus.Completed) {
          return { snapshot, lastEvents: events };
        }

        // Player ends their turn.
        const playerEndResult = engine.executeAction(
          snapshot,
          { type: ActionType.EndTurn, actorId },
          definition,
        );
        events.push(...playerEndResult.events);
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
          events.push(...aiResult.events);
          snapshot = aiResult.state;

          if (snapshot.status === MatchStatus.Completed) break;

          // If the AI played a card, end its turn.
          if (aiAction.type === ActionType.UseCard) {
            const aiEndResult = engine.executeAction(
              snapshot,
              { type: ActionType.EndTurn, actorId: aiActorId },
              definition,
            );
            events.push(...aiEndResult.events);
            snapshot = aiEndResult.state;
          }
        }

        return { snapshot, lastEvents: events };
      });
    },
    [engine, definition, agent],
  );

  return { snapshot: state.snapshot, lastEvents: state.lastEvents, playCard };
}
