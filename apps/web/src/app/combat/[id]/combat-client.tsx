"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type CardDefinition } from "@proximity/simulation";
import { CombatBoard } from "@/components/combat/combat-board";
import { useDeck } from "@/lib/progression/deck-context";
import { useProgression } from "@/lib/progression/progression-context";
import { ENCOUNTER_REGISTRY } from "@/lib/simulation/encounters";
import {
  createEncounterParticipant,
  createLocalPlayerParticipant,
  createMatchDefinition,
} from "@/lib/simulation/match-factory";

interface CombatClientProps {
  readonly encounterId: string;
}

export function CombatClient({ encounterId }: CombatClientProps) {
  const encounter = ENCOUNTER_REGISTRY.get(encounterId)!;
  const router = useRouter();
  const { completeEncounter, completedEncounterIds, unlockedCardDefinitions } =
    useProgression();
  const { activeDeck } = useDeck();

  // Snapshot completion state at mount so replay wins don't re-show the reward screen.
  const [isReplay] = useState(() => completedEncounterIds.has(encounterId));

  const localParticipant = useMemo(
    () => createLocalPlayerParticipant({ cardDefinitionIds: activeDeck }),
    [activeDeck],
  );

  const opponentParticipant = useMemo(
    () => createEncounterParticipant(encounter),
    [encounter],
  );

  const allCardDefinitions = useMemo(
    () => new Map([...unlockedCardDefinitions, ...encounter.cardDefinitions]),
    [unlockedCardDefinitions, encounter],
  );

  const definition = useMemo(
    () =>
      createMatchDefinition(
        [localParticipant, opponentParticipant],
        allCardDefinitions,
      ),
    [localParticipant, opponentParticipant, allCardDefinitions],
  );

  const rewardCardDefinitions = useMemo<readonly CardDefinition[]>(
    () =>
      encounter.rewardCardIds
        .map((id) => encounter.cardDefinitions.get(id))
        .filter((def): def is CardDefinition => def !== undefined),
    [encounter],
  );

  const handleVictory = useCallback(() => {
    completeEncounter(
      encounterId,
      encounter.rewardCardIds,
      encounter.cardDefinitions,
    );
  }, [
    completeEncounter,
    encounterId,
    encounter.rewardCardIds,
    encounter.cardDefinitions,
  ]);

  return (
    <CombatBoard
      matchId={encounterId}
      localParticipant={localParticipant}
      opponentParticipant={opponentParticipant}
      definition={definition}
      rewardCardDefinitions={isReplay ? [] : rewardCardDefinitions}
      onVictory={handleVictory}
      onLeave={() => router.push("/encounters")}
    />
  );
}
