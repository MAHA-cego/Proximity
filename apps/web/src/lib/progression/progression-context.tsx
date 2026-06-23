"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  STARTER_CARD_DEFINITIONS,
  type CardDefinition,
  type CardDefinitionId,
} from "@proximity/simulation";
import {
  ENCOUNTER_ORDER,
  ENCOUNTER_REGISTRY,
} from "@/lib/simulation/encounters";
import { storage } from "@/lib/session-storage";

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
}

interface ProgressionContextValue extends ProgressionState {
  readonly availableEncounterIds: ReadonlySet<string>;
  readonly completeEncounter: (
    encounterId: string,
    rewardCardIds: readonly CardDefinitionId[],
    encounterCardDefinitions: ReadonlyMap<CardDefinitionId, CardDefinition>,
  ) => void;
}

interface PersistedProgression {
  completedEncounterIds: string[];
  unlockedCardIds: string[];
}

function buildInitialState(): ProgressionState {
  const saved = storage.get<PersistedProgression>("progression");
  if (!saved) {
    return {
      completedEncounterIds: new Set(),
      unlockedCardIds: INITIAL_UNLOCKED_CARD_IDS,
      unlockedCardDefinitions: INITIAL_UNLOCKED_CARD_DEFINITIONS,
    };
  }

  const completedEncounterIds = new Set(saved.completedEncounterIds);
  const unlockedCardIds = new Set(saved.unlockedCardIds as CardDefinitionId[]);

  // Reconstruct card definitions from starter set + encounter rewards
  const unlockedCardDefinitions = new Map(STARTER_CARD_DEFINITIONS);
  for (const encounterId of saved.completedEncounterIds) {
    const encounter = ENCOUNTER_REGISTRY.get(encounterId);
    if (!encounter) continue;
    for (const id of encounter.rewardCardIds) {
      const def = encounter.cardDefinitions.get(id);
      if (def) unlockedCardDefinitions.set(id, def);
    }
  }

  return { completedEncounterIds, unlockedCardIds, unlockedCardDefinitions };
}

const ProgressionContext = createContext<ProgressionContextValue | null>(null);

export function ProgressionProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [state, setState] = useState<ProgressionState>(() => {
    if (typeof window === "undefined") {
      return {
        completedEncounterIds: new Set(),
        unlockedCardIds: INITIAL_UNLOCKED_CARD_IDS,
        unlockedCardDefinitions: INITIAL_UNLOCKED_CARD_DEFINITIONS,
      };
    }
    return buildInitialState();
  });

  // Persist progression whenever it changes
  useEffect(() => {
    storage.set("progression", {
      completedEncounterIds: [...state.completedEncounterIds],
      unlockedCardIds: [...state.unlockedCardIds],
    });
  }, [state]);

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

        return {
          completedEncounterIds: nextCompletedIds,
          unlockedCardIds: nextUnlockedIds,
          unlockedCardDefinitions: nextCardDefs,
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
