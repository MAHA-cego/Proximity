"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EventType,
  MatchStatus,
  ModifierType,
  StatusType,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type CombatantId,
  type CombatantLoadout,
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
import { useDeck } from "@/lib/progression/deck-context";
import { useProgression } from "@/lib/progression/progression-context";
import { ENCOUNTER_REGISTRY } from "@/lib/simulation/encounters";
import {
  createMatchDefinition,
  PLAYER_COMBATANT_ID,
} from "@/lib/simulation/match-factory";

const EVENT_DELAY_MS = 150;
const MATCH_COMPLETE_DELAY_MS = 800;

type MatchPhase =
  | "player-turn"
  | "playback"
  | "match-complete"
  | "victory"
  | "defeat";

interface CombatClientProps {
  readonly encounterId: string;
}

function combatantName(combatantId: CombatantId, opponentName: string): string {
  return combatantId === PLAYER_COMBATANT_ID ? "You" : opponentName;
}

function cardName(cardDefinitionId: CardDefinitionId): string {
  return (cardDefinitionId as string)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Semantic color palette:
// crimson  = damage (dealt, DoT statuses)
// amber    = offensive buffs (attack modifiers, Berserk)
// azure    = defensive buffs (Shield, Parry)
// emerald  = healing (healing done, heal modifiers, Regeneration)
// violet   = manipulation (Feint, Opening)
// muted    = neutral / inhibition (Exhausted)

const STATUS_LABELS: Record<StatusType, { label: string; className: string }> =
  {
    [StatusType.Berserk]: { label: "Berserk", className: "text-amber" },
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

const STATUS_SHOWS_AMOUNT = new Set<StatusType>([
  StatusType.Bleeding,
  StatusType.Burn,
  StatusType.Parry,
  StatusType.Regeneration,
  StatusType.Shield,
]);

const MODIFIER_LABELS: Record<
  ModifierType,
  { label: (amount: number) => string; className: string }
> = {
  [ModifierType.Damage]: {
    label: (amount) => `+${amount} attack`,
    className: "text-amber",
  },
  [ModifierType.DamageMultiplier]: {
    label: (amount) => `${amount}× damage`,
    className: "text-amber",
  },
  [ModifierType.Heal]: {
    label: (amount) => `+${amount} healing`,
    className: "text-emerald",
  },
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
          {name(event.actorId)} uses {cardName(event.cardDefinitionId)}.
        </CombatLogEntry>
      );

    case EventType.DamageDealt: {
      const { cause } = event;
      const causeNode =
        cause?.kind === "card" ? (
          <> from {cardName(cause.cardId)}</>
        ) : cause?.kind === "status" ? (
          <>
            {" "}
            from{" "}
            <span className={STATUS_LABELS[cause.statusType].className}>
              {STATUS_LABELS[cause.statusType].label}
            </span>
          </>
        ) : null;
      const verb = cause?.kind === "status" ? "suffers" : "takes";
      return (
        <CombatLogEntry key={index} align={align}>
          {name(event.targetId)} {verb}{" "}
          <span className="text-crimson">{event.amount}</span> damage
          {causeNode}.
        </CombatLogEntry>
      );
    }

    case EventType.HealingDone: {
      const { cause } = event;
      const causeNode =
        cause?.kind === "card" ? (
          <> from {cardName(cause.cardId)}</>
        ) : cause?.kind === "status" ? (
          <>
            {" "}
            from{" "}
            <span className={STATUS_LABELS[cause.statusType].className}>
              {STATUS_LABELS[cause.statusType].label}
            </span>
          </>
        ) : null;
      return (
        <CombatLogEntry key={index} align={align}>
          {name(event.targetId)} recovers{" "}
          <span className="text-emerald">{event.amount}</span> HP{causeNode}.
        </CombatLogEntry>
      );
    }

    case EventType.StatusApplied: {
      const { label, className } = STATUS_LABELS[event.statusType];
      const showAmount =
        event.amount > 0 && STATUS_SHOWS_AMOUNT.has(event.statusType);
      return (
        <CombatLogEntry key={index} align={align}>
          {name(event.targetId)} gains{" "}
          <span className={className}>{label}</span>
          {showAmount && (
            <>
              {" "}
              (<span className={className}>{event.amount}</span>)
            </>
          )}
          .
        </CombatLogEntry>
      );
    }

    case EventType.StatusRemoved: {
      const { label, className } = STATUS_LABELS[event.statusType];
      return (
        <CombatLogEntry key={index} align={align}>
          <span className={className}>{label}</span> on {name(event.targetId)}{" "}
          fades.
        </CombatLogEntry>
      );
    }

    case EventType.ModifierApplied: {
      const { label, className } = MODIFIER_LABELS[event.modifierType];
      return (
        <CombatLogEntry key={index} align={align}>
          {name(event.targetId)} gains{" "}
          <span className={className}>{label(event.amount)}</span>.
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
          ? `You win. ${opponentName} has been defeated.`
          : `${opponentName} wins. You have been defeated.`;
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
      // Card became ready after being on cooldown — only meaningful for the player's own hand.
      if (
        event.previousCooldown > 0 &&
        event.newCooldown === 0 &&
        event.targetId === PLAYER_COMBATANT_ID
      ) {
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
      // Mid-cooldown tick and opponent ready events: already visible on cards; skip.
      return null;
    }

    case EventType.TurnEnded:
      return null;
  }
}

export function CombatClient({ encounterId }: CombatClientProps) {
  const encounter = ENCOUNTER_REGISTRY.get(encounterId)!;

  const router = useRouter();
  const { completeEncounter, completedEncounterIds, unlockedCardDefinitions } =
    useProgression();
  const { activeDeck } = useDeck();

  // Snapshot completion state at mount so replay wins don't re-show the reward screen.
  const [isReplay] = useState(() => completedEncounterIds.has(encounterId));

  const playerLoadout = useMemo<CombatantLoadout>(
    () => ({ cardDefinitionIds: activeDeck }),
    [activeDeck],
  );

  const definition = useMemo(
    () =>
      createMatchDefinition(encounter, playerLoadout, unlockedCardDefinitions),
    [encounter, playerLoadout, unlockedCardDefinitions],
  );

  const agent = useMemo(() => encounter.createAgent(), [encounter]);

  const rewardCardDefinitions = useMemo<readonly CardDefinition[]>(
    () =>
      encounter.rewardCardIds
        .map((id) => encounter.cardDefinitions.get(id))
        .filter((def): def is CardDefinition => def !== undefined),
    [encounter],
  );
  const {
    snapshot,
    playerPhaseEvents,
    aiPhaseEvents,
    playCard,
    canPlayCard,
    endTurn,
    reset,
  } = useCombat(encounterId, definition, agent);

  // Match lifecycle
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("player-turn");
  // Sub-state within "playback" — which side is currently acting
  const [playbackSide, setPlaybackSide] = useState<
    "player" | "opponent" | null
  >(null);

  // Synchronous guard: set true when a playback sequence is starting (before the
  // first setTimeout fires) and cleared when playback completes. Prevents the
  // auto-advance effect from calling endTurn() twice in the same render cycle.
  const playbackPendingRef = useRef(false);

  // Revealed event log
  const [revealedEvents, setRevealedEvents] = useState<readonly GameEvent[]>(
    [],
  );
  const [revealedInBatch, setRevealedInBatch] = useState<readonly GameEvent[]>(
    [],
  );
  const [batchKey, setBatchKey] = useState(0);

  const playerState = snapshot.combatants.find(
    (cs) => cs.combatant.id === PLAYER_COMBATANT_ID,
  )!;

  const opponentState = snapshot.combatants.find(
    (cs) => cs.combatant.id !== PLAYER_COMBATANT_ID,
  )!;

  const roundNumber = Math.ceil(snapshot.turn.number / 2);
  const isMatchOver = matchPhase === "victory" || matchPhase === "defeat";

  // Consume the ordered event stream from useCombat and reveal events one by one.
  // Drives the match lifecycle from playback → player-turn or match-complete.
  useEffect(() => {
    const playerBatch = [...playerPhaseEvents];
    const aiBatch = [...aiPhaseEvents];
    const totalPlayerEvents = playerBatch.length;
    const allEvents = [...playerBatch, ...aiBatch];

    if (allEvents.length === 0) return;

    // Block auto-advance synchronously: the ref is set before any setTimeout fires,
    // so the auto-advance effect (running in the same commit) sees it immediately.
    playbackPendingRef.current = true;

    let index = 0;
    let active = true;
    let lifecycleTimeout: ReturnType<typeof setTimeout> | null = null;

    function revealNext() {
      if (!active) return;
      const event = allEvents[index++];
      const position = index - 1;

      if (position === 0) {
        // First event — enter playback and initialise the batch.
        setBatchKey((k) => k + 1);
        setMatchPhase("playback");
        setPlaybackSide(totalPlayerEvents > 0 ? "player" : "opponent");
        setRevealedInBatch([event]);
      } else if (position === totalPlayerEvents && totalPlayerEvents > 0) {
        // First AI event — transition to opponent side.
        setPlaybackSide("opponent");
        setRevealedInBatch((prev) => [...prev, event]);
      } else {
        setRevealedInBatch((prev) => [...prev, event]);
      }

      setRevealedEvents((prev) => [...prev, event]);

      if (index < allEvents.length) {
        setTimeout(revealNext, EVENT_DELAY_MS);
      } else {
        // Playback complete — clear the guard before setting player-turn so the
        // next render's auto-advance effect can evaluate legal actions correctly.
        playbackPendingRef.current = false;
        setPlaybackSide(null);
        if (snapshot.status === MatchStatus.Completed) {
          setMatchPhase("match-complete");
          lifecycleTimeout = setTimeout(() => {
            setMatchPhase(opponentState.health <= 0 ? "victory" : "defeat");
          }, MATCH_COMPLETE_DELAY_MS);
        } else {
          setMatchPhase("player-turn");
        }
      }
    }

    setTimeout(revealNext, EVENT_DELAY_MS);

    return () => {
      active = false;
      playbackPendingRef.current = false;
      if (lifecycleTimeout !== null) clearTimeout(lifecycleTimeout);
    };
  }, [playerPhaseEvents, aiPhaseEvents, snapshot.status, opponentState.health]);

  // Grant encounter rewards exactly once when the player wins.
  useEffect(() => {
    if (matchPhase === "victory") {
      completeEncounter(
        encounterId,
        encounter.rewardCardIds,
        encounter.cardDefinitions,
      );
    }
  }, [
    matchPhase,
    completeEncounter,
    encounterId,
    encounter.rewardCardIds,
    encounter.cardDefinitions,
  ]);

  // Auto-advance: if it's the player's turn and no card can legally be played,
  // submit EndTurn on their behalf. The playbackPendingRef guard prevents a
  // double-advance in the render where playback is starting but matchPhase has
  // not yet transitioned to "playback".
  useEffect(() => {
    if (matchPhase !== "player-turn") return;
    if (playbackPendingRef.current) return;
    if (snapshot.status !== MatchStatus.InProgress) return;

    const hasLegalCard = playerState.cards.some((card) =>
      canPlayCard(card.instanceId),
    );
    if (!hasLegalCard) {
      endTurn();
    }
  }, [matchPhase, snapshot, playerState, canPlayCard, endTurn]);

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
      : matchPhase === "defeat"
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
      : matchPhase === "victory"
        ? "defeated"
        : null;

  const handlePlayCard = (cardInstanceId: CardInstanceId) => {
    playCard(cardInstanceId);
  };

  const handleReset = () => {
    playbackPendingRef.current = false;
    reset();
    setRevealedEvents([]);
    setRevealedInBatch([]);
    setMatchPhase("player-turn");
    setPlaybackSide(null);
    setBatchKey(0);
  };

  return (
    <div className="bg-background text-foreground relative flex h-screen flex-col overflow-hidden">
      {/* Match Header */}
      <header className="border-border shrink-0 border-b px-6 py-4">
        <Stack direction="row" align="center" justify="between">
          <p className="text-foreground font-mono text-sm">{encounter.name}</p>
          <TurnIndicator roundNumber={roundNumber} isCompleted={isMatchOver} />
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

      {/* Phase strip — always visible while match is in progress */}
      {!isMatchOver && (
        <div className="border-border flex shrink-0 justify-center border-t py-2">
          <p className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
            {matchPhase === "player-turn"
              ? "your turn"
              : playbackSide === "opponent"
                ? "opponent acting"
                : "resolving"}
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
              isPlayable={
                matchPhase === "player-turn" && canPlayCard(card.instanceId)
              }
              lockedByRequirements={
                matchPhase === "player-turn" &&
                card.remainingCooldown === 0 &&
                !canPlayCard(card.instanceId)
              }
              onPlay={() => handlePlayCard(card.instanceId)}
            />
          ))}
        </div>
      </section>

      {/* Match Overlay — appears only after lifecycle reaches victory or defeat */}
      {isMatchOver && (
        <MatchOverlay
          playerWon={matchPhase === "victory"}
          encounterName={encounter.name}
          rewardCardDefinitions={isReplay ? [] : rewardCardDefinitions}
          onReplay={handleReset}
          onLeave={() => router.push("/encounters")}
        />
      )}
    </div>
  );
}
