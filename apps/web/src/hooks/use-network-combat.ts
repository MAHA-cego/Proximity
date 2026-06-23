"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CardInstanceId,
  type CombatantId,
  type GameEvent,
  type GameState,
  type MatchDefinition,
} from "@proximity/simulation";
import type { ClientMessage, ServerMessage } from "@proximity/protocol";
import type { CombatControls } from "./use-combat";

export type ConnectionPhase =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error"
  | "abandoned";

export type OpponentConnectionPhase = "connected" | "disconnected";

export interface NetworkCombatControls extends CombatControls {
  readonly connectionPhase: ConnectionPhase;
  readonly opponentConnectionPhase: OpponentConnectionPhase;
  readonly yourCombatantId: CombatantId;
  readonly matchDefinition: MatchDefinition;
}

interface NetworkCombatState {
  readonly snapshot: GameState | null;
  readonly yourCombatantId: CombatantId | null;
  readonly matchDefinition: MatchDefinition | null;
  readonly localPhaseEvents: readonly GameEvent[];
  readonly automatedPhaseEvents: readonly GameEvent[];
  readonly connectionPhase: ConnectionPhase;
  readonly opponentConnectionPhase: OpponentConnectionPhase;
}

const RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useNetworkCombat(
  serverUrl: string,
  matchId: string,
  playerId: string,
): NetworkCombatControls | null {
  const [state, setState] = useState<NetworkCombatState>({
    snapshot: null,
    yourCombatantId: null,
    matchDefinition: null,
    localPhaseEvents: [],
    automatedPhaseEvents: [],
    connectionPhase: "connecting",
    opponentConnectionPhase: "connected",
  });

  const wsRef = useRef<WebSocket | null>(null);
  const pendingLocalActionRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    let cleanedUp = false;
    reconnectAttemptsRef.current = 0;

    function connect(): void {
      if (cleanedUp) return;

      const url = new URL(serverUrl);
      url.searchParams.set("matchId", matchId);
      url.searchParams.set("playerId", playerId);

      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      ws.onmessage = (event: MessageEvent<string>) => {
        if (cleanedUp) return;
        try {
          const msg = JSON.parse(event.data) as ServerMessage;

          if (msg.type === "match-state") {
            reconnectAttemptsRef.current = 0;
            setState({
              snapshot: msg.state,
              yourCombatantId: msg.yourCombatantId,
              matchDefinition: {
                combatants: msg.definition.combatants,
                cardDefinitions: new Map(msg.definition.cardDefinitions),
              },
              localPhaseEvents: [],
              automatedPhaseEvents: [],
              connectionPhase: "connected",
              opponentConnectionPhase: "connected",
            });
          } else if (msg.type === "events") {
            const isLocal = pendingLocalActionRef.current;
            pendingLocalActionRef.current = false;
            setState((prev) => ({
              ...prev,
              snapshot: msg.state,
              localPhaseEvents: isLocal ? msg.events : [],
              automatedPhaseEvents: isLocal ? [] : msg.events,
            }));
          } else if (msg.type === "opponent-disconnected") {
            setState((prev) => ({
              ...prev,
              opponentConnectionPhase: "disconnected",
            }));
          } else if (msg.type === "opponent-reconnected") {
            setState((prev) => ({
              ...prev,
              opponentConnectionPhase: "connected",
            }));
          } else if (msg.type === "match-abandoned") {
            setState((prev) => ({ ...prev, connectionPhase: "abandoned" }));
          } else if (msg.type === "error") {
            console.error("[network-combat]", msg.code, msg.message);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        if (!cleanedUp) {
          setState((prev) => ({ ...prev, connectionPhase: "error" }));
        }
      };

      ws.onclose = (event) => {
        if (cleanedUp) return;

        // Codes that indicate the server intentionally rejected the connection.
        const isTerminal = event.code === 1000 || event.code === 1008;

        if (
          isTerminal ||
          reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS
        ) {
          setState((prev) => ({ ...prev, connectionPhase: "disconnected" }));
          return;
        }

        reconnectAttemptsRef.current++;
        setState((prev) => ({ ...prev, connectionPhase: "reconnecting" }));
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      cleanedUp = true;
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close(1000, "Component unmounted");
      wsRef.current = null;
    };
  }, [serverUrl, matchId, playerId]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const playCard = useCallback(
    (cardInstanceId: CardInstanceId) => {
      pendingLocalActionRef.current = true;
      send({ type: "use-card", cardInstanceId });
    },
    [send],
  );

  const endTurn = useCallback(() => {
    pendingLocalActionRef.current = true;
    send({ type: "end-turn" });
  }, [send]);

  const canPlayCard = useCallback(
    (cardInstanceId: CardInstanceId): boolean => {
      const { snapshot, yourCombatantId } = state;
      if (!snapshot || !yourCombatantId) return false;
      if (snapshot.turn.activeCombatantId !== yourCombatantId) return false;
      const myState = snapshot.combatants.find(
        (cs) => cs.combatant.id === yourCombatantId,
      );
      const card = myState?.cards.find((c) => c.instanceId === cardInstanceId);
      return card?.remainingCooldown === 0;
    },
    [state],
  );

  const reset = useCallback(() => {
    // Network matches are server-owned; reset is a no-op on the client.
  }, []);

  const {
    snapshot,
    yourCombatantId,
    matchDefinition,
    connectionPhase,
    opponentConnectionPhase,
  } = state;

  if (!snapshot || !yourCombatantId || !matchDefinition) return null;

  return {
    snapshot,
    localPhaseEvents: state.localPhaseEvents,
    automatedPhaseEvents: state.automatedPhaseEvents,
    playCard,
    canPlayCard,
    endTurn,
    reset,
    connectionPhase,
    opponentConnectionPhase,
    yourCombatantId,
    matchDefinition,
  };
}
