import { WebSocket } from "ws";
import type { IncomingMessage } from "node:http";
import type { ClientMessage } from "@proximity/protocol";
import { getMatch } from "./match-store.js";

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
    try {
      const msg = JSON.parse(data.toString()) as ClientMessage;
      match.submitAction(playerId, msg);
    } catch {
      ws.send(
        JSON.stringify({
          type: "error",
          code: "PARSE_ERROR",
          message: "Invalid JSON",
        }),
      );
    }
  });

  ws.on("close", () => {
    match.removeConnection(playerId);
  });
}
