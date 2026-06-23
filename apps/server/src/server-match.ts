import { WebSocket } from "ws";
import {
  createEngine,
  ActionType,
  MatchStatus,
  type CombatantId,
  type GameState,
  type MatchDefinition,
  type MatchId,
} from "@proximity/simulation";
import type {
  ClientMessage,
  ServerMessage,
  SerializedMatchDefinition,
} from "@proximity/protocol";

const engine = createEngine();

const DISCONNECT_GRACE_MS = 200;

export class ServerMatch {
  private state: GameState;
  private readonly connections = new Map<string, WebSocket>();
  private readonly disconnectTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private isRematched = false;

  constructor(
    readonly matchId: string,
    private readonly lobbyCode: string | null,
    private readonly definition: MatchDefinition,
    private readonly serializedDefinition: SerializedMatchDefinition,
    private readonly playerMap: ReadonlyMap<string, CombatantId>,
  ) {
    this.state = engine.initializeGame(matchId as MatchId, definition);
  }

  registerConnection(playerId: string, ws: WebSocket): void {
    const combatantId = this.playerMap.get(playerId);
    if (!combatantId) {
      ws.close(1008, "Player not registered for this match");
      return;
    }
    if (this.isRematched) {
      ws.close(1008, "Match has been rematched");
      return;
    }

    const pendingTimer = this.disconnectTimers.get(playerId);
    if (pendingTimer !== undefined) {
      clearTimeout(pendingTimer);
      this.disconnectTimers.delete(playerId);
    }

    this.connections.set(playerId, ws);

    this.sendTo(ws, {
      type: "match-state",
      state: this.state,
      yourCombatantId: combatantId,
      definition: this.serializedDefinition,
    });
  }

  removeConnection(playerId: string): void {
    this.connections.delete(playerId);
    if (this.isRematched) return;

    const timer = setTimeout(() => {
      this.disconnectTimers.delete(playerId);
      if (this.isRematched) return;
      if (this.connections.has(playerId)) return;

      const actorId = this.playerMap.get(playerId);
      if (actorId && this.state.status === MatchStatus.InProgress) {
        const concedeAction = { type: ActionType.Concede as const, actorId };
        if (
          engine.canExecuteAction(this.state, concedeAction, this.definition)
        ) {
          const result = engine.executeAction(
            this.state,
            concedeAction,
            this.definition,
          );
          this.state = result.state;
          this.broadcast({
            type: "events",
            events: result.events,
            state: this.state,
          });
        }
      }
    }, DISCONNECT_GRACE_MS);

    this.disconnectTimers.set(playerId, timer);
  }

  submitAction(playerId: string, msg: ClientMessage): void {
    const combatantId = this.playerMap.get(playerId);
    if (!combatantId) {
      this.sendErrorToPlayer(playerId, "UNAUTHORIZED", "Player not registered");
      return;
    }

    let allEvents: ReturnType<typeof this.executeClientMessage>;
    try {
      allEvents = this.executeClientMessage(playerId, msg, combatantId);
    } catch {
      this.sendErrorToPlayer(
        playerId,
        "ACTION_REJECTED",
        "Action rejected by engine",
      );
      return;
    }

    if (allEvents !== null) {
      this.broadcast({ type: "events", events: allEvents, state: this.state });
    }
  }

  requestRematch(): string | null {
    if (this.isRematched || !this.lobbyCode) return null;
    this.isRematched = true;
    for (const timer of this.disconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.disconnectTimers.clear();
    return this.lobbyCode;
  }

  broadcastRematchAvailable(code: string): void {
    this.broadcast({ type: "rematch-available", code });
  }

  private executeClientMessage(
    playerId: string,
    msg: ClientMessage,
    actorId: CombatantId,
  ): ReturnType<typeof engine.executeAction>["events"] | null {
    switch (msg.type) {
      case "use-card": {
        const useAction = {
          type: ActionType.UseCard as const,
          actorId,
          cardInstanceId: msg.cardInstanceId,
        };
        if (!engine.canExecuteAction(this.state, useAction, this.definition)) {
          this.sendErrorToPlayer(
            playerId,
            "ACTION_REJECTED",
            "Action not valid in current state",
          );
          return null;
        }
        const useResult = engine.executeAction(
          this.state,
          useAction,
          this.definition,
        );
        const allEvents = [...useResult.events];
        this.state = useResult.state;

        if (this.state.status === MatchStatus.InProgress) {
          const endResult = engine.executeAction(
            this.state,
            { type: ActionType.EndTurn as const, actorId },
            this.definition,
          );
          allEvents.push(...endResult.events);
          this.state = endResult.state;
        }
        return allEvents;
      }

      case "end-turn": {
        const endAction = { type: ActionType.EndTurn as const, actorId };
        if (!engine.canExecuteAction(this.state, endAction, this.definition)) {
          this.sendErrorToPlayer(
            playerId,
            "ACTION_REJECTED",
            "Action not valid in current state",
          );
          return null;
        }
        const result = engine.executeAction(
          this.state,
          endAction,
          this.definition,
        );
        this.state = result.state;
        return [...result.events];
      }

      case "concede": {
        const concedeAction = { type: ActionType.Concede as const, actorId };
        if (
          !engine.canExecuteAction(this.state, concedeAction, this.definition)
        ) {
          this.sendErrorToPlayer(
            playerId,
            "ACTION_REJECTED",
            "Action not valid in current state",
          );
          return null;
        }
        const result = engine.executeAction(
          this.state,
          concedeAction,
          this.definition,
        );
        this.state = result.state;
        return [...result.events];
      }

      case "request-rematch":
        return null;
    }
  }

  private broadcast(msg: ServerMessage): void {
    const payload = JSON.stringify(msg);
    for (const ws of this.connections.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  private sendTo(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  private sendErrorToPlayer(
    playerId: string,
    code: string,
    message: string,
  ): void {
    const ws = this.connections.get(playerId);
    if (ws) this.sendTo(ws, { type: "error", code, message });
  }
}
