"use client";

import { useMemo } from "react";
import { EventType, MatchStatus } from "@proximity/simulation";
import { Section, Stack } from "@/components/ui";
import {
  CombatCard,
  CombatLogEntry,
  MatchOverlay,
  OpponentArea,
  PlayerArea,
  TurnIndicator,
} from "@/components/combat";
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
        <Stack direction="row" align="center" justify="between">
          <p className="text-foreground font-mono text-sm">{encounter.name}</p>
          <TurnIndicator
            turnNumber={snapshot.turn.number}
            isPlayerTurn={isPlayerTurn}
            isCompleted={isCompleted}
          />
        </Stack>
      </header>

      {/* Middle row — Player Area | Combat Feed | Opponent Area */}
      <main className="flex flex-1 overflow-hidden">
        <PlayerArea name="Player" state={playerState} />

        {/* Combat Feed — label pins at top, events scroll below */}
        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="border-border shrink-0 border-b px-6 py-4">
            <p className="text-muted text-xs tracking-[0.3em] uppercase">
              Combat Feed
            </p>
          </div>
          <Stack gap={2} className="flex-1 overflow-y-auto px-6 py-4">
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
                return <CombatLogEntry key={i} text={text} />;
              })
            )}
          </Stack>
        </section>

        <OpponentArea name={encounter.name} state={opponentState} />
      </main>

      {/* Player Hand */}
      <section className="border-border shrink-0 border-t px-6 py-5">
        <Section label="Player Hand" gap={3}>
          <Stack direction="row" gap={2} wrap>
            {playerState.cards.map((card) => (
              <CombatCard
                key={card.instanceId}
                definitionId={card.definitionId}
                remainingCooldown={card.remainingCooldown}
                isPlayable={card.remainingCooldown === 0 && isPlayerTurn}
                onPlay={() => playCard(card.instanceId)}
              />
            ))}
          </Stack>
        </Section>
      </section>

      {/* Context Area — tooltip and card detail target */}
      <aside className="border-border shrink-0 border-t px-6 py-2">
        <Section label="Context" />
      </aside>

      {/* Match Overlay — rendered on top when match completes */}
      {isCompleted && (
        <MatchOverlay playerWon={playerWon} encounterName={encounter.name} />
      )}
    </div>
  );
}
