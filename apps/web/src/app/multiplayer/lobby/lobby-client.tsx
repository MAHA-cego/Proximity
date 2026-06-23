"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { storage } from "@/lib/session-storage";
import type { CardDefinitionId } from "@proximity/simulation";
import { useProgression } from "@/lib/progression/progression-context";
import { DECK_SIZE } from "@/lib/progression/deck-context";

interface LobbyStateView {
  code: string;
  phase: "waiting" | "both-joined" | "started";
  guestJoined: boolean;
  playerReady: boolean;
  opponentReady: boolean;
  matchId: string | null;
}

function formatCardName(id: CardDefinitionId): string {
  return String(id)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function LobbyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get("code") ?? "";
  const playerId = searchParams.get("playerId") ?? "";
  const serverUrl = decodeURIComponent(
    searchParams.get("server") ??
      process.env["NEXT_PUBLIC_SERVER_URL"] ??
      "http://localhost:3001",
  );
  const wsUrl = serverUrl.replace(/^https?/, (p) =>
    p === "https" ? "wss" : "ws",
  );

  const { unlockedCardIds, unlockedCardDefinitions } = useProgression();

  const [deck, setDeck] = useState<CardDefinitionId[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = storage.get<string[]>(`lobby-deck:${code}`);
    return Array.isArray(saved) ? (saved as CardDefinitionId[]) : [];
  });
  const [submitted, setSubmitted] = useState(false);
  const [lobbyState, setLobbyState] = useState<LobbyStateView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(
        `${serverUrl}/lobbies/${code}?playerId=${encodeURIComponent(playerId)}`,
      );
      if (!res.ok) return;
      const state = (await res.json()) as LobbyStateView;
      setLobbyState(state);
      if (state.phase === "started" && state.matchId) {
        router.push(
          `/multiplayer/combat?server=${encodeURIComponent(wsUrl)}&matchId=${encodeURIComponent(state.matchId)}&playerId=${encodeURIComponent(playerId)}`,
        );
      }
    } catch {
      // server may be temporarily unreachable; keep polling
    }
  }, [code, playerId, serverUrl, wsUrl, router]);

  useEffect(() => {
    const immediate = setTimeout(() => void poll(), 0);
    const id = setInterval(() => void poll(), 2000);
    return () => {
      clearTimeout(immediate);
      clearInterval(id);
    };
  }, [poll]);

  const handleSubmitDeck = async () => {
    if (deck.length !== DECK_SIZE) return;
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/lobbies/${code}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, deckCardIds: deck }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `Server returned ${res.status}`);
      }
      setSubmitted(true);
      void poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit deck");
    }
  };

  const addCard = (id: CardDefinitionId) => {
    setDeck((prev) => {
      if (prev.length >= DECK_SIZE) return prev;
      const next = [...prev, id];
      storage.set(`lobby-deck:${code}`, next);
      return next;
    });
  };

  const removeCard = (id: CardDefinitionId) => {
    setDeck((prev) => {
      const next = prev.filter((c) => c !== id);
      storage.set(`lobby-deck:${code}`, next);
      return next;
    });
  };

  const deckSet = new Set(deck);
  const allCardIds = [...unlockedCardIds];
  const unequipped = allCardIds.filter((id) => !deckSet.has(id));
  const isDeckValid = deck.length === DECK_SIZE;
  const remaining = DECK_SIZE - deck.length;

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border flex shrink-0 items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => router.push("/play")}
            className="border-border text-muted hover:bg-surface cursor-pointer border px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase"
          >
            Leave
          </button>
          <div className="flex flex-col gap-1">
            <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
              Lobby code
            </p>
            <p className="text-foreground font-mono text-2xl tracking-[0.4em]">
              {code}
            </p>
          </div>
        </div>

        <div className="text-right">
          {!lobbyState?.guestJoined && (
            <p className="text-muted font-mono text-xs">
              Waiting for opponent…
            </p>
          )}
          {lobbyState?.guestJoined && !lobbyState.opponentReady && (
            <p className="text-foreground font-mono text-xs">Opponent joined</p>
          )}
          {lobbyState?.guestJoined && lobbyState.opponentReady && (
            <p className="text-emerald font-mono text-xs">Opponent ready</p>
          )}
        </div>
      </header>

      {!submitted ? (
        <div className="flex flex-1 flex-col gap-8 px-6 py-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
                Your deck
              </p>
              <p className="text-muted font-mono text-xs">
                {deck.length} / {DECK_SIZE}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {deck.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => removeCard(id)}
                  className="border-foreground text-foreground cursor-pointer border px-3 py-1 font-mono text-xs hover:opacity-60"
                >
                  {formatCardName(id)} ×
                </button>
              ))}
              {deck.length === 0 && (
                <p className="text-muted font-mono text-xs">
                  No cards selected.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
              Collection
            </p>
            {unequipped.length === 0 ? (
              <p className="text-muted font-mono text-xs">
                All cards are in your deck.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {unequipped.map((id) => {
                  const def = unlockedCardDefinitions.get(id);
                  if (!def) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => addCard(id)}
                      className="border-border text-foreground hover:border-foreground cursor-pointer border px-3 py-1 font-mono text-xs"
                    >
                      {formatCardName(id)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void handleSubmitDeck()}
              disabled={!isDeckValid}
              className={[
                "self-start border px-6 py-3 font-mono text-xs tracking-[0.3em] uppercase",
                isDeckValid
                  ? "border-foreground text-foreground hover:bg-surface cursor-pointer"
                  : "border-border text-muted cursor-not-allowed opacity-50",
              ].join(" ")}
            >
              {isDeckValid ? "Ready" : `${remaining} more needed`}
            </button>
            {error && <p className="text-crimson font-mono text-xs">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 px-6 py-8">
          <p className="text-foreground font-mono text-xs">Deck submitted.</p>
          {!lobbyState?.opponentReady ? (
            <p className="text-muted font-mono text-xs">
              Waiting for opponent…
            </p>
          ) : (
            <p className="text-foreground font-mono text-xs">Starting match…</p>
          )}
        </div>
      )}
    </div>
  );
}
