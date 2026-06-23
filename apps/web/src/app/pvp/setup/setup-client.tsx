"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type CardDefinition,
  type CardDefinitionId,
} from "@proximity/simulation";
import { Stack } from "@/components/ui";
import { CardRules } from "@/components/combat";
import { DECK_SIZE } from "@/lib/progression/deck-context";
import { useProgression } from "@/lib/progression/progression-context";

type SetupPhase = "p1-deck" | "handoff" | "p2-deck";

function formatCardName(id: CardDefinitionId): string {
  return String(id)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function CardFace({ definition }: { readonly definition: CardDefinition }) {
  return (
    <>
      <div className="border-border flex h-8 shrink-0 items-center border-b px-3">
        <p className="text-foreground truncate font-mono text-xs">
          {formatCardName(definition.id)}
        </p>
      </div>
      <div className="bg-surface-raised border-border h-24 w-full shrink-0 border-b" />
      <div className="border-border flex h-7 shrink-0 items-center border-b px-3">
        <p className="text-muted font-mono text-xs">
          {definition.cooldown > 0 ? `cd ${definition.cooldown}` : "—"}
        </p>
      </div>
      <div className="flex-1 overflow-hidden px-3 py-2">
        <CardRules definition={definition} />
      </div>
    </>
  );
}

interface DeckPickerProps {
  readonly playerLabel: string;
  readonly deck: readonly CardDefinitionId[];
  readonly allCardIds: readonly CardDefinitionId[];
  readonly definitions: ReadonlyMap<CardDefinitionId, CardDefinition>;
  readonly onAdd: (id: CardDefinitionId) => void;
  readonly onRemove: (id: CardDefinitionId) => void;
  readonly onDone: () => void;
  readonly onBack: () => void;
}

function DeckPicker({
  playerLabel,
  deck,
  allCardIds,
  definitions,
  onAdd,
  onRemove,
  onDone,
  onBack,
}: DeckPickerProps) {
  const deckSet = new Set(deck);
  const emptySlots = DECK_SIZE - deck.length;
  const unequipped = allCardIds.filter((id) => !deckSet.has(id));
  const isDeckValid = deck.length === DECK_SIZE;
  const remaining = DECK_SIZE - deck.length;

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border shrink-0 border-b px-6 py-4">
        <Stack direction="row" align="center" justify="between">
          <p className="text-foreground font-mono text-sm">{playerLabel}</p>
          <p className="text-muted font-mono text-xs">
            {deck.length} / {DECK_SIZE}
          </p>
        </Stack>
      </header>

      <section className="border-border shrink-0 border-b px-6 py-8">
        <Stack gap={4}>
          <p className="text-muted text-xs tracking-[0.3em] uppercase">Deck</p>
          <Stack direction="row" wrap gap={3}>
            {deck.map((id) => {
              const def = definitions.get(id)!;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onRemove(id)}
                  className="bg-surface border-foreground flex h-80 w-36 cursor-pointer flex-col border text-left transition-opacity duration-150 hover:opacity-60"
                >
                  <CardFace definition={def} />
                </button>
              );
            })}
            {Array.from({ length: emptySlots }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="border-border h-80 w-36 border border-dashed"
              />
            ))}
          </Stack>
        </Stack>
      </section>

      <section className="flex-1 px-6 py-8">
        <Stack gap={6}>
          <p className="text-muted text-xs tracking-[0.3em] uppercase">
            Collection
          </p>
          {unequipped.length === 0 ? (
            <p className="text-muted text-xs">All cards are in your deck.</p>
          ) : (
            <Stack direction="row" wrap gap={3}>
              {unequipped.map((id) => {
                const def = definitions.get(id);
                if (!def) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onAdd(id)}
                    className="bg-surface border-border hover:border-foreground flex h-80 w-36 cursor-pointer flex-col border text-left transition-colors duration-150"
                  >
                    <CardFace definition={def} />
                  </button>
                );
              })}
            </Stack>
          )}
        </Stack>
      </section>

      <footer className="border-border shrink-0 border-t px-6 py-4">
        <Stack gap={3}>
          <Stack direction="row" align="center" justify="between">
            <button
              type="button"
              onClick={onBack}
              className="border-border text-muted hover:bg-surface cursor-pointer border px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onDone}
              disabled={!isDeckValid}
              className={[
                "border px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase",
                isDeckValid
                  ? "border-foreground text-foreground hover:bg-surface cursor-pointer"
                  : "border-border text-muted cursor-not-allowed opacity-50",
              ].join(" ")}
            >
              Done
            </button>
          </Stack>
          {!isDeckValid && (
            <p className="text-muted text-center font-mono text-xs">
              {remaining} more {remaining === 1 ? "card" : "cards"} needed
            </p>
          )}
        </Stack>
      </footer>
    </div>
  );
}

export function SetupClient() {
  const router = useRouter();
  const { unlockedCardIds, unlockedCardDefinitions } = useProgression();

  const [phase, setPhase] = useState<SetupPhase>("p1-deck");
  const [p1Deck, setP1Deck] = useState<CardDefinitionId[]>([]);
  const [p2Deck, setP2Deck] = useState<CardDefinitionId[]>([]);

  const allCardIds = [...unlockedCardIds];

  const addCard =
    (deck: CardDefinitionId[], set: (d: CardDefinitionId[]) => void) =>
    (id: CardDefinitionId) => {
      if (deck.length < DECK_SIZE) set([...deck, id]);
    };

  const removeCard =
    (deck: CardDefinitionId[], set: (d: CardDefinitionId[]) => void) =>
    (id: CardDefinitionId) =>
      set(deck.filter((c) => c !== id));

  const handleLaunch = () => {
    const p1 = p1Deck.join(",");
    const p2 = p2Deck.join(",");
    router.push(`/pvp/combat?p1=${p1}&p2=${p2}`);
  };

  if (phase === "p1-deck") {
    return (
      <DeckPicker
        playerLabel="Player 1 — Build your deck"
        deck={p1Deck}
        allCardIds={allCardIds}
        definitions={unlockedCardDefinitions}
        onAdd={addCard(p1Deck, setP1Deck)}
        onRemove={removeCard(p1Deck, setP1Deck)}
        onDone={() => setPhase("handoff")}
        onBack={() => router.push("/encounters")}
      />
    );
  }

  if (phase === "handoff") {
    return (
      <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-8">
        <Stack gap={4} align="center">
          <p className="text-muted text-xs tracking-[0.3em] uppercase">
            Next up
          </p>
          <p className="text-foreground font-mono text-lg">Player 2</p>
        </Stack>
        <p className="text-muted max-w-xs text-center font-mono text-xs">
          Pass the device to Player 2 to build their deck.
        </p>
        <button
          type="button"
          autoFocus
          onClick={() => setPhase("p2-deck")}
          className="border-foreground text-foreground hover:bg-surface cursor-pointer border px-6 py-3 font-mono text-xs tracking-[0.3em] uppercase"
        >
          Begin
        </button>
      </div>
    );
  }

  return (
    <DeckPicker
      playerLabel="Player 2 — Build your deck"
      deck={p2Deck}
      allCardIds={allCardIds}
      definitions={unlockedCardDefinitions}
      onAdd={addCard(p2Deck, setP2Deck)}
      onRemove={removeCard(p2Deck, setP2Deck)}
      onDone={handleLaunch}
      onBack={() => setPhase("handoff")}
    />
  );
}
