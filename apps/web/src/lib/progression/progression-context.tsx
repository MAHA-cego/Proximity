"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BATTLE_CRY_ID,
  BERSERK_ID,
  EXPLOIT_ID,
  FEINT_ID,
  HEAVY_STRIKE_ID,
  LACERATION_ID,
  PARRY_ID,
  PREPARATION_ID,
  REGENERATION_ID,
  SLASH_ID,
  STARTER_CARD_DEFINITIONS,
  STARTER_LOADOUT,
  type CardDefinition,
  type CardDefinitionId,
} from "@proximity/simulation";
import { ENCOUNTER_ORDER } from "@/lib/simulation/encounters";

// Authored deck states, indexed by number of completed encounters.
// Each stage introduces mechanics unlocked by the preceding encounter.
const DECK_PROGRESSION: readonly (readonly CardDefinitionId[])[] = [
  // Stage 0 — starter: basic attacks, a block, a heal, a DoT, a buff
  STARTER_LOADOUT.cardDefinitionIds,
  // Stage 1 — after Shepherd's Dog: replace basic defense/heal with Parry and Berserk
  [
    SLASH_ID,
    HEAVY_STRIKE_ID,
    BATTLE_CRY_ID,
    LACERATION_ID,
    PARRY_ID,
    BERSERK_ID,
  ],
  // Stage 2 — after Hunter: replace basics with Preparation and Regeneration
  [
    HEAVY_STRIKE_ID,
    LACERATION_ID,
    PARRY_ID,
    BERSERK_ID,
    PREPARATION_ID,
    REGENERATION_ID,
  ],
  // Stage 3 — after Militiaman: replace aggression with the Feint/Exploit finesse pair
  [
    HEAVY_STRIKE_ID,
    LACERATION_ID,
    PARRY_ID,
    PREPARATION_ID,
    FEINT_ID,
    EXPLOIT_ID,
  ],
];

const INITIAL_UNLOCKED_CARD_IDS: ReadonlySet<CardDefinitionId> = new Set(
  STARTER_CARD_DEFINITIONS.keys(),
);
const INITIAL_UNLOCKED_CARD_DEFINITIONS: ReadonlyMap<
  CardDefinitionId,
  CardDefinition
> = STARTER_CARD_DEFINITIONS;

interface ProgressionState {
  readonly completedEncounterIds: ReadonlySet<string>;
  readonly unlockedCardIds: ReadonlySet<CardDefinitionId>;
  readonly unlockedCardDefinitions: ReadonlyMap<
    CardDefinitionId,
    CardDefinition
  >;
  readonly currentDeck: readonly CardDefinitionId[];
}

interface ProgressionContextValue extends ProgressionState {
  readonly availableEncounterIds: ReadonlySet<string>;
  readonly completeEncounter: (
    encounterId: string,
    rewardCardIds: readonly CardDefinitionId[],
    encounterCardDefinitions: ReadonlyMap<CardDefinitionId, CardDefinition>,
  ) => void;
}

const ProgressionContext = createContext<ProgressionContextValue | null>(null);

export function ProgressionProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [state, setState] = useState<ProgressionState>({
    completedEncounterIds: new Set(),
    unlockedCardIds: INITIAL_UNLOCKED_CARD_IDS,
    unlockedCardDefinitions: INITIAL_UNLOCKED_CARD_DEFINITIONS,
    currentDeck: STARTER_LOADOUT.cardDefinitionIds,
  });

  // An encounter is available if it is first in order, or the one before it is completed.
  const availableEncounterIds = useMemo<ReadonlySet<string>>(
    () =>
      new Set(
        ENCOUNTER_ORDER.filter(
          (id, i) =>
            i === 0 || state.completedEncounterIds.has(ENCOUNTER_ORDER[i - 1]!),
        ),
      ),
    [state.completedEncounterIds],
  );

  const completeEncounter = useCallback(
    (
      encounterId: string,
      rewardCardIds: readonly CardDefinitionId[],
      encounterCardDefinitions: ReadonlyMap<CardDefinitionId, CardDefinition>,
    ) => {
      setState((prev) => {
        if (prev.completedEncounterIds.has(encounterId)) return prev;

        const nextCompletedIds = new Set([
          ...prev.completedEncounterIds,
          encounterId,
        ]);

        const nextUnlockedIds = new Set(prev.unlockedCardIds);
        const nextCardDefs = new Map(prev.unlockedCardDefinitions);
        for (const id of rewardCardIds) {
          nextUnlockedIds.add(id);
          const def = encounterCardDefinitions.get(id);
          if (def !== undefined) nextCardDefs.set(id, def);
        }

        const deckStage = Math.min(
          nextCompletedIds.size,
          DECK_PROGRESSION.length - 1,
        );

        return {
          completedEncounterIds: nextCompletedIds,
          unlockedCardIds: nextUnlockedIds,
          unlockedCardDefinitions: nextCardDefs,
          currentDeck: DECK_PROGRESSION[deckStage]!,
        };
      });
    },
    [],
  );

  return (
    <ProgressionContext.Provider
      value={{ ...state, availableEncounterIds, completeEncounter }}
    >
      {children}
    </ProgressionContext.Provider>
  );
}

export function useProgression(): ProgressionContextValue {
  const ctx = useContext(ProgressionContext);
  if (ctx === null) {
    throw new Error("useProgression must be used within ProgressionProvider");
  }
  return ctx;
}
