"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type CardDefinitionId,
  type MatchDefinition,
} from "@proximity/simulation";
import { CombatBoard } from "@/components/combat/combat-board";
import { useCombat } from "@/hooks/use-combat";
import { useProgression } from "@/lib/progression/progression-context";
import {
  createLocalPlayerParticipant,
  createLocalPlayer2Participant,
  createMatchDefinition,
  type MatchParticipant,
} from "@/lib/simulation/match-factory";

interface PvpSessionProps {
  readonly localParticipant: MatchParticipant;
  readonly opponentParticipant: MatchParticipant;
  readonly definition: MatchDefinition;
  readonly participants: readonly [MatchParticipant, MatchParticipant];
  readonly onReplay: () => void;
  readonly onLeave: () => void;
}

function PvpSession({
  localParticipant,
  opponentParticipant,
  definition,
  participants,
  onReplay,
  onLeave,
}: PvpSessionProps) {
  const controls = useCombat("pvp", definition, participants);

  return (
    <CombatBoard
      localParticipant={localParticipant}
      opponentParticipant={opponentParticipant}
      definition={definition}
      rewardCardDefinitions={[]}
      controls={controls}
      onReplay={onReplay}
      onLeave={onLeave}
    />
  );
}

export function PvpCombatClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { unlockedCardDefinitions } = useProgression();

  const [matchKey, setMatchKey] = useState(0);

  const p1DeckIds = useMemo<CardDefinitionId[]>(
    () =>
      (searchParams.get("p1") ?? "")
        .split(",")
        .filter(Boolean) as CardDefinitionId[],
    [searchParams],
  );

  const p2DeckIds = useMemo<CardDefinitionId[]>(
    () =>
      (searchParams.get("p2") ?? "")
        .split(",")
        .filter(Boolean) as CardDefinitionId[],
    [searchParams],
  );

  const p1Participant = useMemo(
    () =>
      createLocalPlayerParticipant(
        { cardDefinitionIds: p1DeckIds },
        "Player 1",
      ),
    [p1DeckIds],
  );

  const p2Participant = useMemo(
    () =>
      createLocalPlayer2Participant(
        { cardDefinitionIds: p2DeckIds },
        "Player 2",
      ),
    [p2DeckIds],
  );

  const definition = useMemo(
    () =>
      createMatchDefinition(
        [p1Participant, p2Participant],
        unlockedCardDefinitions,
      ),
    [p1Participant, p2Participant, unlockedCardDefinitions],
  );

  const participants = useMemo(
    () => [p1Participant, p2Participant] as const,
    [p1Participant, p2Participant],
  );

  return (
    <PvpSession
      key={matchKey}
      localParticipant={p1Participant}
      opponentParticipant={p2Participant}
      definition={definition}
      participants={participants}
      onReplay={() => setMatchKey((k) => k + 1)}
      onLeave={() => router.push("/encounters")}
    />
  );
}
