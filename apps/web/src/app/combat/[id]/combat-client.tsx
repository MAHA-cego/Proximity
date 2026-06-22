"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EventType,
  MatchStatus,
  ModifierType,
  StatusType,
  type CardDefinitionId,
  type CardInstanceId,
  type CombatantId,
  type GameEvent,
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
  type EntryAlignment,
  type PortraitFeedback,
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

function combatantName(combatantId: CombatantId, opponentName: string): string {
  return combatantId === PLAYER_COMBATANT_ID ? "Player" : opponentName;
}

function cardName(cardDefinitionId: CardDefinitionId): string {
  return (cardDefinitionId as string)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const STATUS_LABELS: Record<StatusType, { label: string; className: string }> =
  {
    [StatusType.Berserk]: { label: "Berserk", className: "text-crimson" },
    [StatusType.Bleeding]: { label: "Bleeding", className: "text-crimson" },
    [StatusType.Burn]: { label: "Burn", className: "text-crimson" },
    [StatusType.Exhausted]: { label: "Exhausted", className: "text-muted" },
    [StatusType.FeintActive]: {
      label: "Feint Active",
      className: "text-violet",
    },
    [StatusType.Opening]: { label: "Opening", className: "text-violet" },
    [StatusType.Parry]: { label: "Parry", className: "text-azure" },
    [StatusType.Regeneration]: {
      label: "Regeneration",
      className: "text-emerald",
    },
    [StatusType.Shield]: { label: "Shield", className: "text-azure" },
  };

const MODIFIER_LABELS: Record<
  ModifierType,
  { label: string; className: string }
> = {
  [ModifierType.Damage]: {
    label: "damage bonus",
    className: "text-crimson",
  },
  [ModifierType.DamageMultiplier]: {
    label: "damage multiplier",
    className: "text-crimson",
  },
  [ModifierType.Heal]: { label: "healing bonus", className: "text-emerald" },
};

function eventAlignment(event: GameEvent): EntryAlignment {
  switch (event.type) {
    case EventType.CardPlayed:
      return event.actorId === PLAYER_COMBATANT_ID ? "player" : "opponent";
    case EventType.DamageDealt:
    case EventType.HealingDone:
    case EventType.StatusApplied:
    case EventType.StatusRemoved:
    case EventType.ModifierApplied:
      return event.targetId === PLAYER_COMBATANT_ID ? "player" : "opponent";
    case EventType.CombatantDefeated:
      return event.combatantId === PLAYER_COMBATANT_ID ? "player" : "opponent";
    case EventType.PlayerConceded:
    case EventType.MatchEnded:
    case EventType.TurnEnded:
    case EventType.CooldownChanged:
      return "neutral";
  }
}

function renderEvent(
  event: GameEvent,
  index: number,
  opponentName: string,
): React.ReactNode {
  const align = eventAlignment(event);
  const name = (id: CombatantId) => combatantName(id, opponentName);

  switch (event.type) {
    case EventType.CardPlayed:
      return (
        <CombatLogEntry key={index} align={align}>
          {name(event.actorId)} plays {cardName(event.cardDefinitionId)}.
        </CombatLogEntry>
      );

    case EventType.DamageDealt:
      return (
        <CombatLogEntry key={index} align={align}>
          {name(event.targetId)} takes{" "}
          <span className="text-crimson">{event.amount}</span> damage.
        </CombatLogEntry>
      );

    case EventType.HealingDone:
      return (
        <CombatLogEntry key={index} align={align}>
          {name(event.targetId)} recovers{" "}
          <span className="text-emerald">{event.amount}</span> HP.
        </CombatLogEntry>
      );

    case EventType.StatusApplied: {
      const { label, className } = STATUS_LABELS[event.statusType];
      return (
        <CombatLogEntry key={index} align={align}>
          {name(event.targetId)} gains{" "}
          <span className={className}>{label}</span>.
        </CombatLogEntry>
      );
    }

    case EventType.StatusRemoved: {
      const { label } = STATUS_LABELS[event.statusType];
      return (
        <CombatLogEntry key={index} align={align}>
          {label} on {name(event.targetId)} fades.
        </CombatLogEntry>
      );
    }

    case EventType.ModifierApplied: {
      const { label, className } = MODIFIER_LABELS[event.modifierType];
      return (
        <CombatLogEntry key={index} align={align}>
          {name(event.targetId)} gains{" "}
          <span className={className}>{label}</span>.
        </CombatLogEntry>
      );
    }

    case EventType.CombatantDefeated:
      return (
        <CombatLogEntry key={index} align={align}>
          <span className="text-crimson">{name(event.combatantId)}</span> has
          been defeated.
        </CombatLogEntry>
      );

    case EventType.MatchEnded: {
      const text =
        event.winnerId === PLAYER_COMBATANT_ID
          ? `Player wins. ${opponentName} has been defeated.`
          : `${opponentName} wins. Player has been defeated.`;
      return (
        <CombatLogEntry key={index} align={align}>
          {text}
        </CombatLogEntry>
      );
    }

    case EventType.PlayerConceded:
      return (
        <CombatLogEntry key={index} align={align}>
          {name(event.combatantId)} conceded.
        </CombatLogEntry>
      );

    case EventType.TurnEnded:
    case EventType.CooldownChanged:
      return null;
  }
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

  const feedRef = useRef<HTMLDivElement>(null);

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

  // Events that arrived during the current presentation phase — used only for feedback.
  const currentPhaseEvents =
    phase === "player"
      ? playerPhaseEvents
      : phase === "ai"
        ? aiPhaseEvents
        : [];

  const playerFeedback: PortraitFeedback = currentPhaseEvents.some(
    (e) =>
      e.type === EventType.DamageDealt && e.targetId === PLAYER_COMBATANT_ID,
  )
    ? "damage"
    : currentPhaseEvents.some(
          (e) =>
            e.type === EventType.HealingDone &&
            e.targetId === PLAYER_COMBATANT_ID,
        )
      ? "healing"
      : isCompleted && !playerWon
        ? "defeated"
        : null;

  const opponentFeedback: PortraitFeedback = currentPhaseEvents.some(
    (e) =>
      e.type === EventType.DamageDealt &&
      e.targetId === opponentState.combatant.id,
  )
    ? "damage"
    : currentPhaseEvents.some(
          (e) =>
            e.type === EventType.HealingDone &&
            e.targetId === opponentState.combatant.id,
        )
      ? "healing"
      : isCompleted && playerWon
        ? "defeated"
        : null;

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

  const displayedEvents = useMemo(
    () =>
      phase === "player"
        ? playerPhaseEvents
        : [...playerPhaseEvents, ...aiPhaseEvents],
    [phase, playerPhaseEvents, aiPhaseEvents],
  );

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [displayedEvents]);

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
        <PlayerArea
          name="Player"
          state={playerState}
          feedback={playerFeedback}
          feedbackKey={phase}
        />

        {/* Combat Feed — label pins at top, events scroll below */}
        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="border-border shrink-0 border-b px-6 py-4">
            <p className="text-muted text-xs tracking-[0.3em] uppercase">
              Combat Feed
            </p>
          </div>
          <div
            ref={feedRef}
            className="flex flex-1 flex-col gap-2 overflow-y-auto px-6 py-4"
          >
            {displayedEvents.length === 0 ? (
              <p className="text-muted text-xs">No events yet.</p>
            ) : (
              displayedEvents.flatMap((event, i) => {
                const node = renderEvent(event, i, encounter.name);
                return node !== null ? [node] : [];
              })
            )}
          </div>
        </section>

        <OpponentArea
          name={encounter.name}
          state={opponentState}
          feedback={opponentFeedback}
          feedbackKey={phase}
        />
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
