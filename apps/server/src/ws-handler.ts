import { WebSocket } from "ws";
import type { IncomingMessage } from "node:http";
import type { ClientMessage } from "@proximity/protocol";
import { getMatch, removeMatch } from "./match-store.js";
import { resetForRematch } from "./server-lobby.js";

export function handleWsConnection(
  ws: WebSocket,
  request: IncomingMessage,
): void {
  const params = new URL(request.url ?? "", "ws://localhost").searchParams;

  const matchId = params.get("matchId");
  const playerId = params.get("playerId");

  if (!matchId || !playerId) {
    ws.close(1008, "Missing matchId or playerId");
    return;
  }

  const match = getMatch(matchId);
  if (!match) {
    ws.close(1008, "Match not found");
    return;
  }

  match.registerConnection(playerId, ws);

  ws.on("message", (data) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(data.toString()) as ClientMessage;
    } catch {
      ws.send(
        JSON.stringify({
          type: "error",
          code: "PARSE_ERROR",
          message: "Invalid JSON",
        }),
      );
      return;
    }
    if (msg.type === "request-rematch") {
      const lobbyCode = match.requestRematch();
      if (lobbyCode) {
        resetForRematch(lobbyCode);
        match.broadcastRematchAvailable(lobbyCode);
        removeMatch(match.matchId);
      }
      return;
    }

    match.submitAction(playerId, msg);
  });

  ws.on("close", () => {
    match.removeConnection(playerId);
  });
}
