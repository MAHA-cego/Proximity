"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type CardDefinitionId } from "@proximity/simulation";
import { CombatBoard } from "@/components/combat/combat-board";
import { useProgression } from "@/lib/progression/progression-context";
import {
  createLocalPlayerParticipant,
  createLocalPlayer2Participant,
  createMatchDefinition,
} from "@/lib/simulation/match-factory";

export function PvpCombatClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { unlockedCardDefinitions } = useProgression();

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

  return (
    <CombatBoard
      matchId="pvp"
      localParticipant={p1Participant}
      opponentParticipant={p2Participant}
      definition={definition}
      rewardCardDefinitions={[]}
      onLeave={() => router.push("/encounters")}
    />
  );
}
