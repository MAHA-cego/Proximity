"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_SERVER = "http://localhost:3001";

export function MultiplayerLanding() {
  const router = useRouter();
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleHost = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/lobbies`, { method: "POST" });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const { code, playerId } = (await res.json()) as {
        code: string;
        playerId: string;
      };
      router.push(
        `/multiplayer/lobby?code=${code}&playerId=${encodeURIComponent(playerId)}&server=${encodeURIComponent(serverUrl)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/lobbies/${code}/join`, {
        method: "POST",
      });
      const body = (await res.json()) as { playerId?: string; error?: string };
      if (!res.ok)
        throw new Error(body.error ?? `Server returned ${res.status}`);
      router.push(
        `/multiplayer/lobby?code=${code}&playerId=${encodeURIComponent(body.playerId!)}&server=${encodeURIComponent(serverUrl)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center gap-12 px-6">
      <button
        type="button"
        onClick={() => router.push("/play")}
        className="border-border text-muted hover:bg-surface absolute top-4 left-6 cursor-pointer border px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase"
      >
        Back
      </button>

      <p className="text-muted text-xs tracking-[0.3em] uppercase">
        Online Multiplayer
      </p>

      <div className="flex w-72 flex-col gap-8">
        <div className="flex flex-col gap-2">
          <label className="text-muted font-mono text-xs tracking-[0.2em] uppercase">
            Server
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            className="bg-surface border-border text-foreground focus:border-foreground w-full border px-3 py-2 font-mono text-xs outline-none"
          />
        </div>

        <div className="border-border border-t pt-6">
          <button
            type="button"
            onClick={() => void handleHost()}
            disabled={loading}
            className="border-foreground text-foreground hover:bg-surface w-full cursor-pointer border px-4 py-3 font-mono text-xs tracking-[0.3em] uppercase disabled:cursor-not-allowed disabled:opacity-50"
          >
            Host a Game
          </button>
        </div>

        <div className="border-border flex flex-col gap-3 border-t pt-6">
          <label className="text-muted font-mono text-xs tracking-[0.2em] uppercase">
            Join with code
          </label>
          <input
            type="text"
            placeholder="ABCD"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={4}
            className="bg-surface border-border text-foreground focus:border-foreground w-full border px-3 py-2 text-center font-mono text-sm tracking-[0.3em] uppercase outline-none placeholder:opacity-30"
          />
          <button
            type="button"
            onClick={() => void handleJoin()}
            disabled={loading || joinCode.trim().length === 0}
            className="border-border text-foreground hover:bg-surface w-full cursor-pointer border px-4 py-3 font-mono text-xs tracking-[0.3em] uppercase disabled:cursor-not-allowed disabled:opacity-50"
          >
            Join Game
          </button>
        </div>

        {error && <p className="text-crimson font-mono text-xs">{error}</p>}
      </div>
    </div>
  );
}
