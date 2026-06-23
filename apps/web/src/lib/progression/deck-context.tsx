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
import { STARTER_LOADOUT, type CardDefinitionId } from "@proximity/simulation";
import { useProgression } from "./progression-context";
import { storage } from "@/lib/session-storage";

export const DECK_SIZE = 6;

interface DeckContextValue {
  readonly activeDeck: readonly CardDefinitionId[];
  readonly isDeckValid: boolean;
  readonly addCard: (cardId: CardDefinitionId) => void;
  readonly removeCard: (cardId: CardDefinitionId) => void;
}

const DeckContext = createContext<DeckContextValue | null>(null);

export function DeckProvider({ children }: { readonly children: ReactNode }) {
  const { unlockedCardIds } = useProgression();

  const [activeDeck, setActiveDeck] = useState<readonly CardDefinitionId[]>(
    () => {
      if (typeof window === "undefined")
        return STARTER_LOADOUT.cardDefinitionIds;
      const saved = storage.get<string[]>("deck");
      if (Array.isArray(saved) && saved.length > 0) {
        return saved as CardDefinitionId[];
      }
      return STARTER_LOADOUT.cardDefinitionIds;
    },
  );

  // Persist deck on change
  useEffect(() => {
    storage.set("deck", activeDeck);
  }, [activeDeck]);

  const isDeckValid = useMemo(
    () =>
      activeDeck.length === DECK_SIZE &&
      new Set(activeDeck).size === activeDeck.length &&
      activeDeck.every((id) => unlockedCardIds.has(id)),
    [activeDeck, unlockedCardIds],
  );

  const addCard = useCallback(
    (cardId: CardDefinitionId) => {
      if (!unlockedCardIds.has(cardId)) return;
      setActiveDeck((prev) => {
        if (prev.length >= DECK_SIZE || prev.includes(cardId)) return prev;
        return [...prev, cardId];
      });
    },
    [unlockedCardIds],
  );

  const removeCard = useCallback((cardId: CardDefinitionId) => {
    setActiveDeck((prev) => prev.filter((id) => id !== cardId));
  }, []);

  return (
    <DeckContext.Provider
      value={{ activeDeck, isDeckValid, addCard, removeCard }}
    >
      {children}
    </DeckContext.Provider>
  );
}

export function useDeck(): DeckContextValue {
  const ctx = useContext(DeckContext);
  if (ctx === null) {
    throw new Error("useDeck must be used within DeckProvider");
  }
  return ctx;
}
