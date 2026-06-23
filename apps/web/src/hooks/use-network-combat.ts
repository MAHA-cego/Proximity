"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  readonly rematchCode: string | null;
  readonly requestRematch: () => void;
}

interface NetworkCombatState {
  readonly snapshot: GameState | null;
  readonly yourCombatantId: CombatantId | null;
  readonly matchDefinition: MatchDefinition | null;
  readonly localPhaseEvents: readonly GameEvent[];
  readonly automatedPhaseEvents: readonly GameEvent[];
  readonly connectionPhase: ConnectionPhase;
  readonly opponentConnectionPhase: OpponentConnectionPhase;
  readonly rematchCode: string | null;
}

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
    rematchCode: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const pendingLocalActionRef = useRef(false);
  const effectTokenRef = useRef<symbol | null>(null);

  // Always-current ref so stable callbacks can read latest state.
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const token = Symbol();
    effectTokenRef.current = token;

    const isActive = () => effectTokenRef.current === token;

    function connect(): void {
      if (!isActive()) return;

      const url = new URL(serverUrl);
      url.searchParams.set("matchId", matchId);
      url.searchParams.set("playerId", playerId);

      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      ws.onmessage = (event: MessageEvent<string>) => {
        if (!isActive()) return;
        try {
          const msg = JSON.parse(event.data) as ServerMessage;

          if (msg.type === "match-state") {
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
              rematchCode: null,
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
          } else if (msg.type === "rematch-available") {
            setState((prev) => ({ ...prev, rematchCode: msg.code }));
          } else if (msg.type === "error") {
            console.error("[network-combat]", msg.code, msg.message);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        if (isActive()) {
          setState((prev) => ({ ...prev, connectionPhase: "error" }));
        }
      };

      ws.onclose = () => {
        if (!isActive()) return;
        setState((prev) => ({ ...prev, connectionPhase: "disconnected" }));
      };
    }

    connect();

    return () => {
      effectTokenRef.current = null;
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

  const requestRematch = useCallback(() => {
    send({ type: "request-rematch" });
  }, [send]);

  const playCard = useCallback(
    (cardInstanceId: CardInstanceId) => {
      pendingLocalActionRef.current = true;
      send({ type: "use-card", cardInstanceId });
    },
    [send],
  );

  const endTurn = useCallback(() => {
    const { snapshot, yourCombatantId } = stateRef.current;
    if (!snapshot || snapshot.turn.activeCombatantId !== yourCombatantId)
      return;
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

  const {
    snapshot,
    yourCombatantId,
    matchDefinition,
    connectionPhase,
    opponentConnectionPhase,
    rematchCode,
  } = state;

  if (!snapshot || !yourCombatantId || !matchDefinition) return null;

  return {
    snapshot,
    localPhaseEvents: state.localPhaseEvents,
    automatedPhaseEvents: state.automatedPhaseEvents,
    playCard,
    canPlayCard,
    endTurn,
    connectionPhase,
    opponentConnectionPhase,
    yourCombatantId,
    matchDefinition,
    rematchCode,
    requestRematch,
  };
}
