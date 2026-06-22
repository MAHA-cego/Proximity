"use client";

import { useMemo } from "react";
import { EventType, MatchStatus } from "@proximity/simulation";
import { useCombat } from "@/hooks/use-combat";
import { ENCOUNTER_REGISTRY } from "@/lib/simulation/encounters";
import {
  createMatchDefinition,
  PLAYER_COMBATANT_ID,
} from "@/lib/simulation/match-factory";

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

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

  const { snapshot, lastEvents, playCard } = useCombat(
    encounterId,
    definition,
    agent,
  );

  const playerState = snapshot.combatants.find(
    (cs) => cs.combatant.id === PLAYER_COMBATANT_ID,
  )!;

  const opponentState = snapshot.combatants.find(
    (cs) => cs.combatant.id !== PLAYER_COMBATANT_ID,
  )!;

  const isCompleted = snapshot.status === MatchStatus.Completed;
  const isPlayerTurn =
    snapshot.turn.activeCombatantId === PLAYER_COMBATANT_ID && !isCompleted;
  const playerWon = isCompleted && opponentState.health <= 0;

  return (
    <div className="bg-background text-foreground relative flex h-screen flex-col overflow-hidden">
      {/* Match Header */}
      <header className="border-border shrink-0 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-foreground font-mono text-sm">{encounter.name}</p>
          <p className="text-muted text-xs tracking-[0.3em] uppercase">
            {isCompleted
              ? "Match ended"
              : `Turn ${snapshot.turn.number} — ${isPlayerTurn ? "Your turn" : "Opponent's turn"}`}
          </p>
        </div>
      </header>

      {/* Middle row — Opponent Area | Combat Feed | Player Area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Opponent Area */}
        <aside className="border-border flex w-64 shrink-0 flex-col overflow-hidden border-r p-5">
          <p className="text-muted mb-4 shrink-0 text-xs tracking-[0.3em] uppercase">
            Opponent
          </p>
          <div className="flex flex-col gap-1.5">
            <p className="text-foreground font-mono text-sm">
              {encounter.name}
            </p>
            <p className="text-muted font-mono text-sm">
              {opponentState.health} / {opponentState.combatant.maxHealth} hp
            </p>
            {opponentState.statuses.length > 0 && (
              <p className="text-muted text-xs">
                {pluralize(opponentState.statuses.length, "status", "statuses")}
              </p>
            )}
            {opponentState.modifiers.length > 0 && (
              <p className="text-muted text-xs">
                {pluralize(
                  opponentState.modifiers.length,
                  "modifier",
                  "modifiers",
                )}
              </p>
            )}
          </div>
        </aside>

        {/* Combat Feed — label pins at top, events scroll below */}
        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="border-border shrink-0 border-b px-6 py-4">
            <p className="text-muted text-xs tracking-[0.3em] uppercase">
              Combat Feed
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-6 py-4">
            {lastEvents.length === 0 ? (
              <p className="text-muted text-xs">No events yet.</p>
            ) : (
              lastEvents.map((event, i) => {
                let text: string;
                switch (event.type) {
                  case EventType.TurnEnded:
                    text = `${event.combatantId === PLAYER_COMBATANT_ID ? "Player" : encounter.name} ended their turn.`;
                    break;
                  case EventType.MatchEnded:
                    text =
                      event.winnerId === PLAYER_COMBATANT_ID
                        ? `Player wins. ${encounter.name} has been defeated.`
                        : `${encounter.name} wins. Player has been defeated.`;
                    break;
                  case EventType.PlayerConceded:
                    text = `${event.combatantId === PLAYER_COMBATANT_ID ? "Player" : encounter.name} conceded.`;
                    break;
                }
                return (
                  <p key={i} className="text-muted text-xs">
                    {text}
                  </p>
                );
              })
            )}
          </div>
        </section>

        {/* Player Area */}
        <aside className="border-border flex w-64 shrink-0 flex-col overflow-hidden border-l p-5">
          <p className="text-muted mb-4 shrink-0 text-xs tracking-[0.3em] uppercase">
            Player
          </p>
          <div className="flex flex-col gap-1.5">
            <p className="text-foreground font-mono text-sm">Player</p>
            <p className="text-muted font-mono text-sm">
              {playerState.health} / {playerState.combatant.maxHealth} hp
            </p>
            {playerState.statuses.length > 0 && (
              <p className="text-muted text-xs">
                {pluralize(playerState.statuses.length, "status", "statuses")}
              </p>
            )}
            {playerState.modifiers.length > 0 && (
              <p className="text-muted text-xs">
                {pluralize(
                  playerState.modifiers.length,
                  "modifier",
                  "modifiers",
                )}
              </p>
            )}
          </div>
        </aside>
      </main>

      {/* Player Hand */}
      <section className="border-border shrink-0 border-t px-6 py-5">
        <p className="text-muted mb-3 text-xs tracking-[0.3em] uppercase">
          Player Hand
        </p>
        <div className="flex flex-wrap gap-2">
          {playerState.cards.map((card) => {
            const onCooldown = card.remainingCooldown > 0;
            const disabled = onCooldown || !isPlayerTurn;
            return (
              <button
                key={card.instanceId}
                onClick={() => playCard(card.instanceId)}
                disabled={disabled}
                className={[
                  "h-9 min-w-[120px] border px-3 text-left font-mono text-xs transition-colors",
                  disabled
                    ? "border-border text-muted cursor-not-allowed"
                    : "border-foreground text-foreground hover:bg-surface-raised cursor-pointer",
                ].join(" ")}
              >
                {card.definitionId}
                {onCooldown && (
                  <span className="text-muted ml-2">
                    ({card.remainingCooldown})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Context Area — tooltip and card detail target */}
      <aside className="border-border shrink-0 border-t px-6 py-2">
        <p className="text-muted text-xs tracking-[0.3em] uppercase">Context</p>
      </aside>

      {/* Match Overlay — rendered on top when match completes */}
      {isCompleted && (
        <div className="bg-background/90 absolute inset-0 flex flex-col items-center justify-center gap-4">
          <p className="text-foreground font-mono text-sm tracking-[0.3em] uppercase">
            {playerWon ? "Victory" : "Defeat"}
          </p>
          <p className="text-muted text-xs">
            {playerWon
              ? `${encounter.name} has been defeated.`
              : "You have been defeated."}
          </p>
        </div>
      )}
    </div>
  );
}
