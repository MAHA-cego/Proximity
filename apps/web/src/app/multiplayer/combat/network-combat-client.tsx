"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CombatBoard } from "@/components/combat/combat-board";
import { useNetworkCombat } from "@/hooks/use-network-combat";
import type { MatchParticipant } from "@/lib/simulation/match-factory";

function ConnectionScreen({
  label,
  onLeave,
}: {
  label: string;
  onLeave: () => void;
}) {
  return (
    <div className="bg-background text-foreground flex h-screen flex-col items-center justify-center gap-6">
      <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
        {label}
      </p>
      <button
        type="button"
        onClick={onLeave}
        className="border-border text-muted hover:bg-surface cursor-pointer border px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase"
      >
        Leave
      </button>
    </div>
  );
}

export function NetworkCombatClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const serverUrl = searchParams.get("server") ?? "ws://localhost:3001";
  const matchId = searchParams.get("matchId") ?? "";
  const playerId = searchParams.get("playerId") ?? "";

  const network = useNetworkCombat(serverUrl, matchId, playerId);

  const onLeave = () => router.push("/encounters");

  const localParticipant = useMemo<MatchParticipant | null>(() => {
    if (!network) return null;
    const cs = network.snapshot.combatants.find(
      (c) => c.combatant.id === network.yourCombatantId,
    );
    if (!cs) return null;
    return {
      combatant: cs.combatant,
      displayName: "You",
      loadout: { cardDefinitionIds: cs.cards.map((c) => c.definitionId) },
      provider: { type: "network", serverUrl, matchId, playerId },
    };
  }, [network, serverUrl, matchId, playerId]);

  const opponentParticipant = useMemo<MatchParticipant | null>(() => {
    if (!network) return null;
    const cs = network.snapshot.combatants.find(
      (c) => c.combatant.id !== network.yourCombatantId,
    );
    if (!cs) return null;
    return {
      combatant: cs.combatant,
      displayName: "Opponent",
      loadout: { cardDefinitionIds: cs.cards.map((c) => c.definitionId) },
      provider: { type: "human" },
    };
  }, [network]);

  // Pre-state: never received initial match-state from server.
  if (!network || !localParticipant || !opponentParticipant) {
    if (network?.connectionPhase === "disconnected") {
      return <ConnectionScreen label="Connection lost" onLeave={onLeave} />;
    }
    if (network?.connectionPhase === "error") {
      return <ConnectionScreen label="Connection error" onLeave={onLeave} />;
    }
    if (network?.connectionPhase === "abandoned") {
      return (
        <ConnectionScreen label="Opponent left the match" onLeave={onLeave} />
      );
    }
    return (
      <div className="bg-background text-foreground flex h-screen items-center justify-center">
        <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
          Connecting…
        </p>
      </div>
    );
  }

  // Terminal states after initial connection.
  if (network.connectionPhase === "disconnected") {
    return <ConnectionScreen label="Connection lost" onLeave={onLeave} />;
  }
  if (network.connectionPhase === "error") {
    return <ConnectionScreen label="Connection error" onLeave={onLeave} />;
  }
  if (network.connectionPhase === "abandoned") {
    return (
      <ConnectionScreen label="Opponent left the match" onLeave={onLeave} />
    );
  }

  const reconnecting = network.connectionPhase === "reconnecting";
  const opponentDisconnected =
    network.opponentConnectionPhase === "disconnected";

  return (
    <div className="relative flex h-screen flex-col">
      {reconnecting && (
        <div className="bg-background/80 absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm">
          <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
            Reconnecting…
          </p>
        </div>
      )}
      {opponentDisconnected && !reconnecting && (
        <div className="border-border bg-surface z-10 flex shrink-0 items-center justify-center border-b px-6 py-3">
          <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
            Waiting for opponent to reconnect…
          </p>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <CombatBoard
          localParticipant={localParticipant}
          opponentParticipant={opponentParticipant}
          definition={network.matchDefinition}
          rewardCardDefinitions={[]}
          controls={network}
          handOffEnabled={false}
          onLeave={onLeave}
        />
      </div>
    </div>
  );
}
