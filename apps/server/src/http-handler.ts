import type { IncomingMessage, ServerResponse } from "node:http";
import type { CreateMatchRequest } from "@proximity/protocol";
import { createMatch } from "./match-store.js";
import {
  createLobby,
  joinLobby,
  submitDeck,
  getLobbyState,
} from "./server-lobby.js";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function setCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export async function handleHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  setCors(res);

  const method = req.method ?? "";
  const rawUrl = req.url ?? "";
  const [pathname = "", search = ""] = rawUrl.split("?") as [string, string];
  const searchParams = new URLSearchParams(search);

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // POST /matches
  if (method === "POST" && pathname === "/matches") {
    try {
      const body = await readBody(req);
      const request: CreateMatchRequest = JSON.parse(
        body,
      ) as CreateMatchRequest;
      createMatch(request);
      json(res, 201, { ok: true });
    } catch (err) {
      json(res, 400, { error: String(err) });
    }
    return;
  }

  // POST /lobbies — create lobby
  if (method === "POST" && pathname === "/lobbies") {
    json(res, 201, createLobby());
    return;
  }

  // Routes under /lobbies/:code
  const lobbyMatch = pathname.match(/^\/lobbies\/([A-Z]+)(\/[a-z]+)?$/);
  if (lobbyMatch) {
    const code = lobbyMatch[1]!;
    const sub = lobbyMatch[2] ?? "";

    // POST /lobbies/:code/join
    if (method === "POST" && sub === "/join") {
      const result = joinLobby(code);
      if (!result) {
        json(res, 400, { error: "Lobby not found or already full" });
        return;
      }
      json(res, 200, result);
      return;
    }

    // POST /lobbies/:code/ready
    if (method === "POST" && sub === "/ready") {
      try {
        const body = await readBody(req);
        const { playerId, deckCardIds } = JSON.parse(body) as {
          playerId: string;
          deckCardIds: string[];
        };
        const result = submitDeck(code, playerId, deckCardIds);
        if (!result) {
          json(res, 400, { error: "Lobby not found or player not registered" });
          return;
        }
        json(res, 200, result);
      } catch (err) {
        json(res, 400, { error: String(err) });
      }
      return;
    }

    // GET /lobbies/:code
    if (method === "GET" && sub === "") {
      const playerId = searchParams.get("playerId") ?? "";
      const state = getLobbyState(code, playerId);
      if (!state) {
        json(res, 404, { error: "Lobby not found" });
        return;
      }
      json(res, 200, state);
      return;
    }
  }

  res.writeHead(404);
  res.end();
}
