"use client";

import { useMemo } from "react";
import { MatchStatus } from "@proximity/simulation";
import { useCombat } from "@/hooks/use-combat";
import { ENCOUNTER_REGISTRY } from "@/lib/simulation/encounters";
import {
  createMatchDefinition,
  PLAYER_COMBATANT_ID,
} from "@/lib/simulation/match-factory";

interface CombatClientProps {
  readonly encounterId: string;
}

export function CombatClient({ encounterId }: CombatClientProps) {
  const encounter = ENCOUNTER_REGISTRY.get(encounterId)!;

  const definition = useMemo(
    () => createMatchDefinition(encounter),
    [encounter],
  );

  const agent = useMemo(() => encounter.createAgent(), [encounter]);

  const { snapshot, playCard } = useCombat(encounterId, definition, agent);

  const playerState = snapshot.combatants.find(
    (cs) => cs.combatant.id === PLAYER_COMBATANT_ID,
  )!;

  const opponentState = snapshot.combatants.find(
    (cs) => cs.combatant.id !== PLAYER_COMBATANT_ID,
  )!;

  const isPlayerTurn =
    snapshot.turn.activeCombatantId === PLAYER_COMBATANT_ID &&
    snapshot.status === MatchStatus.InProgress;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 font-mono">
      <p className="text-muted text-xs tracking-[0.3em] uppercase">
        Turn {snapshot.turn.number}
        {" — "}
        {snapshot.status === MatchStatus.Completed
          ? "Match ended"
          : isPlayerTurn
            ? "Your turn"
            : "Opponent's turn"}
      </p>

      <div className="flex gap-16 text-sm">
        <div className="flex flex-col gap-1">
          <p className="text-foreground">Player</p>
          <p className="text-muted">
            {playerState.health} / {playerState.combatant.maxHealth} hp
          </p>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <p className="text-foreground">{encounter.name}</p>
          <p className="text-muted">
            {opponentState.health} / {opponentState.combatant.maxHealth} hp
          </p>
        </div>
      </div>

      {isPlayerTurn && (
        <div className="flex flex-wrap justify-center gap-2">
          {playerState.cards.map((card) => {
            const unavailable = card.remainingCooldown > 0;
            return (
              <button
                key={card.instanceId}
                onClick={() => !unavailable && playCard(card.instanceId)}
                disabled={unavailable}
                className={[
                  "border px-3 py-1 text-xs transition-colors",
                  unavailable
                    ? "border-border text-muted cursor-not-allowed"
                    : "border-foreground text-foreground hover:bg-surface-raised",
                ].join(" ")}
              >
                {card.definitionId}
                {unavailable && ` (${card.remainingCooldown})`}
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
