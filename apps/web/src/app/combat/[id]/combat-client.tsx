"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EventType,
  MatchStatus,
  type CardDefinitionId,
  type CardInstanceId,
} from "@proximity/simulation";
import { Section, Stack } from "@/components/ui";
import {
  CombatCard,
  CombatLogEntry,
  ContextPanel,
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

type PresentationPhase = "idle" | "player" | "ai";

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

  const router = useRouter();
  const { snapshot, playerPhaseEvents, aiPhaseEvents, playCard, reset } =
    useCombat(encounterId, definition, agent);

  const [phase, setPhase] = useState<PresentationPhase>("idle");

  const [hoveredCardId, setHoveredCardId] = useState<CardDefinitionId | null>(
    null,
  );
  const hoveredCardDef =
    hoveredCardId !== null
      ? (definition.cardDefinitions.get(hoveredCardId) ?? null)
      : null;

  const playerState = snapshot.combatants.find(
    (cs) => cs.combatant.id === PLAYER_COMBATANT_ID,
  )!;

  const opponentState = snapshot.combatants.find(
    (cs) => cs.combatant.id !== PLAYER_COMBATANT_ID,
  )!;

  const isCompleted = snapshot.status === MatchStatus.Completed;
  const playerWon = isCompleted && opponentState.health <= 0;
  const roundNumber = Math.ceil(snapshot.turn.number / 2);
  const canPlay = !isCompleted && phase === "idle";

  const handlePlayCard = (cardInstanceId: CardInstanceId) => {
    playCard(cardInstanceId);
    setPhase("player");
    setTimeout(() => {
      setPhase("ai");
      setTimeout(() => {
        setPhase("idle");
      }, 800);
    }, 800);
  };

  const displayedEvents =
    phase === "player"
      ? playerPhaseEvents
      : [...playerPhaseEvents, ...aiPhaseEvents];

  return (
    <div className="bg-background text-foreground relative flex h-screen flex-col overflow-hidden">
      {/* Match Header */}
      <header className="border-border shrink-0 border-b px-6 py-4">
        <Stack direction="row" align="center" justify="between">
          <p className="text-foreground font-mono text-sm">{encounter.name}</p>
          <TurnIndicator roundNumber={roundNumber} isCompleted={isCompleted} />
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
            {displayedEvents.length === 0 ? (
              <p className="text-muted text-xs">No events yet.</p>
            ) : (
              displayedEvents.flatMap((event, i) => {
                switch (event.type) {
                  case EventType.MatchEnded: {
                    const text =
                      event.winnerId === PLAYER_COMBATANT_ID
                        ? `Player wins. ${encounter.name} has been defeated.`
                        : `${encounter.name} wins. Player has been defeated.`;
                    return [<CombatLogEntry key={i} text={text} />];
                  }
                  case EventType.PlayerConceded: {
                    const text = `${event.combatantId === PLAYER_COMBATANT_ID ? "Player" : encounter.name} conceded.`;
                    return [<CombatLogEntry key={i} text={text} />];
                  }
                  default:
                    return [];
                }
              })
            )}
          </Stack>
        </section>

        <OpponentArea name={encounter.name} state={opponentState} />
      </main>

      {/* Player Hand */}
      <section className="border-border shrink-0 border-t px-6 py-5">
        <Section label="Player Hand" gap={3}>
          {phase !== "idle" && !isCompleted && (
            <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
              {phase === "player" ? "Player action" : "Opponent's response"}
            </p>
          )}
          <Stack direction="row" gap={2} wrap>
            {playerState.cards.map((card) => (
              <CombatCard
                key={card.instanceId}
                definitionId={card.definitionId}
                remainingCooldown={card.remainingCooldown}
                isPlayable={card.remainingCooldown === 0 && canPlay}
                onPlay={() => handlePlayCard(card.instanceId)}
                onHoverStart={() => setHoveredCardId(card.definitionId)}
                onHoverEnd={() => setHoveredCardId(null)}
              />
            ))}
          </Stack>
        </Section>
      </section>

      {/* Context Area — shows hovered card detail or encounter info */}
      <aside className="border-border shrink-0 border-t px-6 py-4">
        <ContextPanel
          cardDefinition={hoveredCardDef}
          encounterName={encounter.name}
        />
      </aside>

      {/* Match Overlay — deferred until presentation completes */}
      {isCompleted && phase === "idle" && (
        <MatchOverlay
          playerWon={playerWon}
          encounterName={encounter.name}
          onReplay={reset}
          onLeave={() => router.push("/encounters")}
        />
      )}
    </div>
  );
}
