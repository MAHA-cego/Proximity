"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  EventType,
  MatchStatus,
  ModifierType,
  StatusType,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstanceId,
  type CombatantId,
  type GameEvent,
  type MatchDefinition,
} from "@proximity/simulation";
import { Stack } from "@/components/ui";
import { CombatCard } from "./combat-card";
import { CombatLogEntry, type EntryAlignment } from "./combat-log-entry";
import { MatchOverlay } from "./match-overlay";
import { OpponentArea } from "./opponent-area";
import { PlayerArea } from "./player-area";
import { type PortraitFeedback } from "./portrait-card";
import { TurnIndicator } from "./turn-indicator";
import { useCombat } from "@/hooks/use-combat";
import type { MatchParticipant } from "@/lib/simulation/match-factory";

const EVENT_DELAY_MS = 150;
const MATCH_COMPLETE_DELAY_MS = 800;

type MatchPhase =
  | "player-turn"
  | "playback"
  | "match-complete"
  | "victory"
  | "defeat"
  | "hand-off";

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

function combatantName(
  combatantId: CombatantId,
  localId: CombatantId,
  opponentName: string,
): string {
  return combatantId === localId ? "You" : opponentName;
}

function cardName(cardDefinitionId: CardDefinitionId): string {
  return (cardDefinitionId as string)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function eventAlignment(
  event: GameEvent,
  localId: CombatantId,
): EntryAlignment {
  switch (event.type) {
    case EventType.CardPlayed:
      return event.actorId === localId ? "player" : "opponent";
    case EventType.DamageDealt:
    case EventType.HealingDone:
    case EventType.StatusApplied:
    case EventType.StatusRemoved:
    case EventType.ModifierApplied:
      return event.targetId === localId ? "player" : "opponent";
    case EventType.CombatantDefeated:
      return event.combatantId === localId ? "player" : "opponent";
    case EventType.CooldownChanged:
      return event.targetId === localId ? "player" : "opponent";
    case EventType.PlayerConceded:
    case EventType.MatchEnded:
    case EventType.TurnEnded:
      return "neutral";
  }
}

function renderEvent(
  event: GameEvent,
  index: number,
  localId: CombatantId,
  opponentName: string,
): React.ReactNode {
  const align = eventAlignment(event, localId);
  const name = (id: CombatantId) => combatantName(id, localId, opponentName);

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
        event.winnerId === localId
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
      if (
        event.previousCooldown > 0 &&
        event.newCooldown === 0 &&
        event.targetId === localId
      ) {
        return (
          <CombatLogEntry key={index} align={align}>
            {card} ready.
          </CombatLogEntry>
        );
      }
      if (event.newCooldown > event.previousCooldown) {
        return (
          <CombatLogEntry key={index} align={align}>
            {card} cooldown extended.
          </CombatLogEntry>
        );
      }
      return null;
    }

    case EventType.TurnEnded:
      return null;
  }
}

export interface CombatBoardProps {
  readonly matchId: string;
  readonly localParticipant: MatchParticipant;
  readonly opponentParticipant: MatchParticipant;
  readonly definition: MatchDefinition;
  readonly rewardCardDefinitions: readonly CardDefinition[];
  readonly onVictory?: () => void;
  readonly onLeave: () => void;
}

export function CombatBoard({
  matchId,
  localParticipant,
  opponentParticipant,
  definition,
  rewardCardDefinitions,
  onVictory,
  onLeave,
}: CombatBoardProps) {
  const localId = localParticipant.combatant.id;

  const [perspectiveId, setPerspectiveId] = useState<CombatantId>(
    () => localId,
  );

  const participants = useMemo(
    () => [localParticipant, opponentParticipant] as const,
    [localParticipant, opponentParticipant],
  );

  const {
    snapshot,
    localPhaseEvents,
    automatedPhaseEvents,
    playCard,
    canPlayCard,
    endTurn,
    reset,
  } = useCombat(matchId, definition, participants);

  const [matchPhase, setMatchPhase] = useState<MatchPhase>("player-turn");
  const [playbackSide, setPlaybackSide] = useState<
    "player" | "opponent" | null
  >(null);

  const playbackPendingRef = useRef(false);

  const [revealedEvents, setRevealedEvents] = useState<readonly GameEvent[]>(
    [],
  );
  const [revealedInBatch, setRevealedInBatch] = useState<readonly GameEvent[]>(
    [],
  );
  const [batchKey, setBatchKey] = useState(0);

  const perspectiveIdRef = useRef<CombatantId>(localId);
  useLayoutEffect(() => {
    perspectiveIdRef.current = perspectiveId;
  });

  const playerState = snapshot.combatants.find(
    (cs) => cs.combatant.id === localId,
  )!;

  const opponentState = snapshot.combatants.find(
    (cs) => cs.combatant.id !== localId,
  )!;

  const activeState = snapshot.combatants.find(
    (cs) => cs.combatant.id === snapshot.turn.activeCombatantId,
  )!;

  const nextParticipant =
    snapshot.turn.activeCombatantId === localParticipant.combatant.id
      ? localParticipant
      : opponentParticipant;

  const roundNumber = Math.ceil(snapshot.turn.number / 2);
  const isMatchOver = matchPhase === "victory" || matchPhase === "defeat";

  useEffect(() => {
    const localBatch = [...localPhaseEvents];
    const automatedBatch = [...automatedPhaseEvents];
    const totalLocalEvents = localBatch.length;
    const allEvents = [...localBatch, ...automatedBatch];

    if (allEvents.length === 0) return;

    playbackPendingRef.current = true;

    let index = 0;
    let active = true;
    let lifecycleTimeout: ReturnType<typeof setTimeout> | null = null;

    function revealNext() {
      if (!active) return;
      const event = allEvents[index++];
      const position = index - 1;

      if (position === 0) {
        setBatchKey((k) => k + 1);
        setMatchPhase("playback");
        setPlaybackSide(totalLocalEvents > 0 ? "player" : "opponent");
        setRevealedInBatch([event]);
      } else if (position === totalLocalEvents && totalLocalEvents > 0) {
        setPlaybackSide("opponent");
        setRevealedInBatch((prev) => [...prev, event]);
      } else {
        setRevealedInBatch((prev) => [...prev, event]);
      }

      setRevealedEvents((prev) => [...prev, event]);

      if (index < allEvents.length) {
        setTimeout(revealNext, EVENT_DELAY_MS);
      } else {
        playbackPendingRef.current = false;
        setPlaybackSide(null);
        if (snapshot.status === MatchStatus.Completed) {
          setMatchPhase("match-complete");
          lifecycleTimeout = setTimeout(() => {
            setMatchPhase(opponentState.health <= 0 ? "victory" : "defeat");
          }, MATCH_COMPLETE_DELAY_MS);
        } else if (
          snapshot.turn.activeCombatantId !== perspectiveIdRef.current
        ) {
          setMatchPhase("hand-off");
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
  }, [
    localPhaseEvents,
    automatedPhaseEvents,
    snapshot.status,
    snapshot.turn.activeCombatantId,
    opponentState.health,
  ]);

  useEffect(() => {
    if (matchPhase === "victory") {
      onVictory?.();
    }
  }, [matchPhase, onVictory]);

  useEffect(() => {
    if (matchPhase !== "player-turn") return;
    if (playbackPendingRef.current) return;
    if (snapshot.status !== MatchStatus.InProgress) return;

    const hasLegalCard = activeState.cards.some((card) =>
      canPlayCard(card.instanceId),
    );
    if (!hasLegalCard) {
      endTurn();
    }
  }, [matchPhase, snapshot, activeState, canPlayCard, endTurn]);

  const playerFeedback: PortraitFeedback = revealedInBatch.some(
    (e) => e.type === EventType.DamageDealt && e.targetId === localId,
  )
    ? "damage"
    : revealedInBatch.some(
          (e) => e.type === EventType.HealingDone && e.targetId === localId,
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

  const handleBeginTurn = () => {
    setPerspectiveId(snapshot.turn.activeCombatantId);
    setMatchPhase("player-turn");
  };

  const handleReset = () => {
    playbackPendingRef.current = false;
    reset();
    setRevealedEvents([]);
    setRevealedInBatch([]);
    setMatchPhase("player-turn");
    setPlaybackSide(null);
    setBatchKey(0);
    setPerspectiveId(localId);
  };

  return (
    <div className="bg-background text-foreground relative flex h-screen flex-col overflow-hidden">
      <header className="border-border shrink-0 border-b px-6 py-4">
        <Stack direction="row" align="center" justify="between">
          <p className="text-foreground font-mono text-sm">
            {opponentParticipant.displayName}
          </p>
          <TurnIndicator roundNumber={roundNumber} isCompleted={isMatchOver} />
        </Stack>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <PlayerArea
          name="Player"
          state={playerState}
          feedback={playerFeedback}
          feedbackKey={String(batchKey)}
        />

        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="border-border shrink-0 border-b px-6 py-4">
            <p className="text-muted text-xs tracking-[0.3em] uppercase">
              Combat Feed
            </p>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <div className="from-background pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b to-transparent" />
            <div className="flex h-full flex-col-reverse gap-2 overflow-hidden px-6 pt-12 pb-4">
              {revealedEvents.length === 0 ? (
                <p className="text-muted text-xs">No events yet.</p>
              ) : (
                [...revealedEvents].reverse().flatMap((event, ri) => {
                  const node = renderEvent(
                    event,
                    revealedEvents.length - 1 - ri,
                    localId,
                    opponentParticipant.displayName,
                  );
                  return node !== null ? [node] : [];
                })
              )}
            </div>
          </div>
        </section>

        <OpponentArea
          name={opponentParticipant.displayName}
          state={opponentState}
          feedback={opponentFeedback}
          feedbackKey={String(batchKey)}
        />
      </main>

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

      <section className="relative z-10 h-32 shrink-0">
        <div className="absolute inset-x-0 -bottom-48 flex justify-center gap-2">
          {activeState.cards.map((card) => (
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

      {matchPhase === "hand-off" && (
        <div className="bg-background absolute inset-0 z-20 flex flex-col items-center justify-center gap-8">
          <Stack gap={4} align="center">
            <p className="text-muted text-xs tracking-[0.3em] uppercase">
              Next up
            </p>
            <p className="text-foreground font-mono text-lg">
              {nextParticipant.displayName}
            </p>
          </Stack>
          <button
            type="button"
            autoFocus
            onClick={handleBeginTurn}
            className="border-foreground text-foreground hover:bg-surface cursor-pointer border px-6 py-3 font-mono text-xs tracking-[0.3em] uppercase"
          >
            Begin Turn
          </button>
        </div>
      )}

      {isMatchOver && (
        <MatchOverlay
          playerWon={matchPhase === "victory"}
          encounterName={opponentParticipant.displayName}
          rewardCardDefinitions={rewardCardDefinitions}
          onReplay={handleReset}
          onLeave={onLeave}
        />
      )}
    </div>
  );
}
