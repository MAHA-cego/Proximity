"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type CardDefinition,
  type MatchDefinition,
} from "@proximity/simulation";
import { CombatBoard } from "@/components/combat/combat-board";
import { useCombat } from "@/hooks/use-combat";
import { useDeck } from "@/lib/progression/deck-context";
import { useProgression } from "@/lib/progression/progression-context";
import { ENCOUNTER_REGISTRY } from "@/lib/simulation/encounters";
import {
  createEncounterParticipant,
  createLocalPlayerParticipant,
  createMatchDefinition,
  type MatchParticipant,
} from "@/lib/simulation/match-factory";

interface PveSessionProps {
  readonly encounterId: string;
  readonly localParticipant: MatchParticipant;
  readonly opponentParticipant: MatchParticipant;
  readonly definition: MatchDefinition;
  readonly participants: readonly [MatchParticipant, MatchParticipant];
  readonly rewardCardDefinitions: readonly CardDefinition[];
  readonly onVictory: () => void;
  readonly onReplay: () => void;
  readonly onLeave: () => void;
}

function PveSession({
  encounterId,
  localParticipant,
  opponentParticipant,
  definition,
  participants,
  rewardCardDefinitions,
  onVictory,
  onReplay,
  onLeave,
}: PveSessionProps) {
  const controls = useCombat(encounterId, definition, participants);

  return (
    <CombatBoard
      localParticipant={localParticipant}
      opponentParticipant={opponentParticipant}
      definition={definition}
      rewardCardDefinitions={rewardCardDefinitions}
      controls={controls}
      onVictory={onVictory}
      onReplay={onReplay}
      onLeave={onLeave}
    />
  );
}

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
  const [matchKey, setMatchKey] = useState(0);

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

  const participants = useMemo(
    () => [localParticipant, opponentParticipant] as const,
    [localParticipant, opponentParticipant],
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
    <PveSession
      key={matchKey}
      encounterId={encounterId}
      localParticipant={localParticipant}
      opponentParticipant={opponentParticipant}
      definition={definition}
      participants={participants}
      rewardCardDefinitions={isReplay ? [] : rewardCardDefinitions}
      onVictory={handleVictory}
      onReplay={() => setMatchKey((k) => k + 1)}
      onLeave={() => router.push("/encounters")}
    />
  );
}
