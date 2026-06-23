"use client";

import { useRouter } from "next/navigation";
import {
  type CardDefinition,
  type CardDefinitionId,
} from "@proximity/simulation";
import {
  cardPrimaryColor,
  CARD_BORDER_CLASS,
  CARD_HOVER_BORDER_CLASS,
} from "@/lib/card-color";
import { cardIllustrationSrc } from "@/lib/illustrations";
import { Stack } from "@/components/ui";
import { CardIllustration, CardRules } from "@/components/combat";
import { DECK_SIZE, useDeck } from "@/lib/progression/deck-context";
import { useProgression } from "@/lib/progression/progression-context";
import { ENCOUNTER_REGISTRY } from "@/lib/simulation/encounters";

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
      <CardIllustration
        src={cardIllustrationSrc(String(definition.id))}
        alt={formatCardName(definition.id)}
      />
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

function CollectionCard({
  definition,
  onAdd,
}: {
  readonly definition: CardDefinition;
  readonly onAdd: () => void;
}) {
  const color = cardPrimaryColor(definition);
  return (
    <button
      type="button"
      onClick={onAdd}
      className={[
        "bg-surface flex h-56 w-40 cursor-pointer flex-col border text-left transition-colors duration-150",
        "border-border",
        CARD_HOVER_BORDER_CLASS[color],
      ].join(" ")}
    >
      <CardFace definition={definition} />
    </button>
  );
}

function CardGroup({
  label,
  cardIds,
  definitions,
  onAdd,
}: {
  readonly label?: string;
  readonly cardIds: readonly CardDefinitionId[];
  readonly definitions: ReadonlyMap<CardDefinitionId, CardDefinition>;
  readonly onAdd: (id: CardDefinitionId) => void;
}) {
  if (cardIds.length === 0) return null;
  return (
    <Stack gap={3}>
      {label && (
        <p className="text-muted text-xs tracking-[0.3em] uppercase">{label}</p>
      )}
      <Stack direction="row" wrap gap={3}>
        {cardIds.map((id) => {
          const def = definitions.get(id);
          if (!def) return null;
          return (
            <CollectionCard key={id} definition={def} onAdd={() => onAdd(id)} />
          );
        })}
      </Stack>
    </Stack>
  );
}

interface DeckClientProps {
  readonly encounterId: string;
}

export function DeckClient({ encounterId }: DeckClientProps) {
  const router = useRouter();
  const encounter = ENCOUNTER_REGISTRY.get(encounterId)!;
  const { unlockedCardIds, unlockedCardDefinitions } = useProgression();
  const { activeDeck, isDeckValid, addCard, removeCard } = useDeck();

  const deckSet = new Set(activeDeck);
  const emptySlots = DECK_SIZE - activeDeck.length;

  const unequippedIds = [...unlockedCardIds].filter((id) => !deckSet.has(id));

  const remaining = DECK_SIZE - activeDeck.length;

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-border shrink-0 border-b px-6 py-4">
        <Stack direction="row" align="center" justify="between">
          <p className="text-foreground font-mono text-sm">{encounter.name}</p>
          <p className="text-muted font-mono text-xs">
            {activeDeck.length} / {DECK_SIZE}
          </p>
        </Stack>
      </header>

      {/* Deck section — clicking a card removes it */}
      <section className="border-border shrink-0 border-b px-6 py-8">
        <Stack gap={4}>
          <p className="text-muted text-xs tracking-[0.3em] uppercase">Deck</p>
          <Stack direction="row" wrap gap={3}>
            {activeDeck.map((id) => {
              const def = unlockedCardDefinitions.get(id)!;
              const borderClass = CARD_BORDER_CLASS[cardPrimaryColor(def)];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => removeCard(id)}
                  className={[
                    "bg-surface flex h-56 w-40 cursor-pointer flex-col border text-left transition-opacity duration-150 hover:opacity-60",
                    borderClass,
                  ].join(" ")}
                >
                  <CardFace definition={def} />
                </button>
              );
            })}
            {Array.from({ length: emptySlots }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="border-border h-56 w-40 border border-dashed"
              />
            ))}
          </Stack>
        </Stack>
      </section>

      {/* Collection section — only unequipped cards; clicking adds to deck */}
      <section className="flex-1 px-6 py-8">
        <Stack gap={6}>
          <p className="text-muted text-xs tracking-[0.3em] uppercase">
            Collection
          </p>

          {unequippedIds.length === 0 ? (
            <p className="text-muted text-xs">All cards are in your deck.</p>
          ) : (
            <CardGroup
              cardIds={unequippedIds}
              definitions={unlockedCardDefinitions}
              onAdd={addCard}
            />
          )}
        </Stack>
      </section>

      {/* Footer */}
      <footer className="border-border shrink-0 border-t px-6 py-4">
        <Stack gap={3}>
          <Stack direction="row" align="center" justify="between">
            <button
              type="button"
              onClick={() => router.back()}
              className="border-border text-muted hover:bg-surface cursor-pointer border px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => router.push(`/combat/${encounterId}`)}
              disabled={!isDeckValid}
              className={[
                "border px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase",
                isDeckValid
                  ? "border-foreground text-foreground hover:bg-surface cursor-pointer"
                  : "border-border text-muted cursor-not-allowed opacity-50",
              ].join(" ")}
            >
              Enter Combat
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
