"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Stack } from "@/components/ui";
import {
  CombatCard,
  CombatLogEntry,
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

const EVENT_DELAY_MS = 150;

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
    case EventType.CooldownChanged:
      return event.targetId === PLAYER_COMBATANT_ID ? "player" : "opponent";
    case EventType.PlayerConceded:
    case EventType.MatchEnded:
    case EventType.TurnEnded:
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

    case EventType.CooldownChanged: {
      const card = cardName(event.cardDefinitionId);
      // Card became ready after being on cooldown.
      if (event.previousCooldown > 0 && event.newCooldown === 0) {
        return (
          <CombatLogEntry key={index} align={align}>
            {card} ready.
          </CombatLogEntry>
        );
      }
      // Cooldown extended by a card effect.
      if (event.newCooldown > event.previousCooldown) {
        return (
          <CombatLogEntry key={index} align={align}>
            {card} cooldown extended.
          </CombatLogEntry>
        );
      }
      // Mid-cooldown tick: already visible on the card; skip.
      return null;
    }

    case EventType.TurnEnded:
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

  // Sequential playback state
  const [revealedEvents, setRevealedEvents] = useState<readonly GameEvent[]>(
    [],
  );
  const [revealedInBatch, setRevealedInBatch] = useState<readonly GameEvent[]>(
    [],
  );
  const [playbackPhase, setPlaybackPhase] = useState<
    "player" | "opponent" | null
  >(null);
  const [batchKey, setBatchKey] = useState(0);

  const playerState = snapshot.combatants.find(
    (cs) => cs.combatant.id === PLAYER_COMBATANT_ID,
  )!;

  const opponentState = snapshot.combatants.find(
    (cs) => cs.combatant.id !== PLAYER_COMBATANT_ID,
  )!;

  const isCompleted = snapshot.status === MatchStatus.Completed;
  const playerWon = isCompleted && opponentState.health <= 0;
  const roundNumber = Math.ceil(snapshot.turn.number / 2);
  const canPlay = !isCompleted && playbackPhase === null;

  // Consume the ordered event stream from useCombat and reveal events one by one.
  // Tracks the player/opponent boundary so the UI can label each phase.
  useEffect(() => {
    const playerBatch = [...playerPhaseEvents];
    const aiBatch = [...aiPhaseEvents];
    const totalPlayerEvents = playerBatch.length;
    const allEvents = [...playerBatch, ...aiBatch];

    if (allEvents.length === 0) return;

    let index = 0;
    let active = true;

    function revealNext() {
      if (!active) return;
      const event = allEvents[index++];
      const position = index - 1;

      if (position === 0) {
        // First event — initialise the batch.
        setBatchKey((k) => k + 1);
        setPlaybackPhase(totalPlayerEvents > 0 ? "player" : "opponent");
        setRevealedInBatch([event]);
      } else if (position === totalPlayerEvents && totalPlayerEvents > 0) {
        // First AI event — transition to opponent phase.
        setPlaybackPhase("opponent");
        setRevealedInBatch((prev) => [...prev, event]);
      } else {
        setRevealedInBatch((prev) => [...prev, event]);
      }

      setRevealedEvents((prev) => [...prev, event]);

      if (index < allEvents.length) {
        setTimeout(revealNext, EVENT_DELAY_MS);
      } else {
        setPlaybackPhase(null);
      }
    }

    setTimeout(revealNext, EVENT_DELAY_MS);

    return () => {
      active = false;
    };
  }, [playerPhaseEvents, aiPhaseEvents]);

  // Portrait feedback: check revealed batch events for damage/healing targeting each combatant.
  const playerFeedback: PortraitFeedback = revealedInBatch.some(
    (e) =>
      e.type === EventType.DamageDealt && e.targetId === PLAYER_COMBATANT_ID,
  )
    ? "damage"
    : revealedInBatch.some(
          (e) =>
            e.type === EventType.HealingDone &&
            e.targetId === PLAYER_COMBATANT_ID,
        )
      ? "healing"
      : isCompleted && !playerWon
        ? "defeated"
        : null;

  const opponentFeedback: PortraitFeedback = revealedInBatch.some(
    (e) =>
      e.type === EventType.DamageDealt &&
      e.targetId === opponentState.combatant.id,
  )
    ? "damage"
    : revealedInBatch.some(
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
  };

  const handleReset = () => {
    reset();
    setRevealedEvents([]);
    setRevealedInBatch([]);
    setPlaybackPhase(null);
    setBatchKey(0);
  };

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
          feedbackKey={String(batchKey)}
        />

        {/* Combat Feed — newest events stay at bottom, oldest fade out above */}
        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="border-border shrink-0 border-b px-6 py-4">
            <p className="text-muted text-xs tracking-[0.3em] uppercase">
              Combat Feed
            </p>
          </div>
          <div className="relative flex-1 overflow-hidden">
            {/* Gradient: events dissolve as they scroll off the top */}
            <div className="from-background pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b to-transparent" />
            <div className="flex h-full flex-col-reverse gap-2 overflow-hidden px-6 pt-12 pb-4">
              {revealedEvents.length === 0 ? (
                <p className="text-muted text-xs">No events yet.</p>
              ) : (
                [...revealedEvents].reverse().flatMap((event, ri) => {
                  const node = renderEvent(
                    event,
                    revealedEvents.length - 1 - ri,
                    encounter.name,
                  );
                  return node !== null ? [node] : [];
                })
              )}
            </div>
          </div>
        </section>

        <OpponentArea
          name={encounter.name}
          state={opponentState}
          feedback={opponentFeedback}
          feedbackKey={String(batchKey)}
        />
      </main>

      {/* Opponent phase indicator */}
      {playbackPhase === "opponent" && !isCompleted && (
        <div className="flex shrink-0 justify-center py-2">
          <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
            Opponent acting.
          </p>
        </div>
      )}

      {/* Player Hand — h-32 peek strip; cards sit at -bottom-28 and hover up */}
      <section className="relative z-10 h-32 shrink-0">
        <div className="absolute inset-x-0 -bottom-28 flex justify-center gap-2">
          {playerState.cards.map((card) => (
            <CombatCard
              key={card.instanceId}
              cardDefinition={
                definition.cardDefinitions.get(card.definitionId)!
              }
              remainingCooldown={card.remainingCooldown}
              isPlayable={card.remainingCooldown === 0 && canPlay}
              onPlay={() => handlePlayCard(card.instanceId)}
            />
          ))}
        </div>
      </section>

      {/* Match Overlay — deferred until playback completes */}
      {isCompleted && playbackPhase === null && (
        <MatchOverlay
          playerWon={playerWon}
          encounterName={encounter.name}
          onReplay={handleReset}
          onLeave={() => router.push("/encounters")}
        />
      )}
    </div>
  );
}
