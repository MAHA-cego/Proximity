"use client";

import { useEffect, useState } from "react";
import type { CardDefinition, CardDefinitionId } from "@proximity/simulation";
import { cardPrimaryColor, CARD_BORDER_CLASS } from "@/lib/card-color";
import { cardIllustrationSrc } from "@/lib/illustrations";
import { Stack } from "@/components/ui";
import { CardIllustration } from "./card-illustration";
import { CardRules } from "./card-rules";

function formatCardName(id: CardDefinitionId): string {
  return String(id)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function RewardCard({ definition }: { readonly definition: CardDefinition }) {
  const borderClass = CARD_BORDER_CLASS[cardPrimaryColor(definition)];
  return (
    <div
      className={[
        "bg-surface flex h-56 w-40 flex-col border",
        borderClass,
      ].join(" ")}
    >
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
    </div>
  );
}

type OverlayPhase = "rewards" | "navigate";

interface MatchOverlayProps {
  readonly playerWon: boolean;
  readonly encounterName: string;
  readonly rewardCardDefinitions: readonly CardDefinition[];
  readonly onReplay?: () => void;
  readonly replayLabel?: string;
  readonly onLeave: () => void;
}

export function MatchOverlay({
  playerWon,
  encounterName,
  rewardCardDefinitions,
  onReplay,
  replayLabel,
  onLeave,
}: MatchOverlayProps) {
  const [visible, setVisible] = useState(false);
  const hasRewards = playerWon && rewardCardDefinitions.length > 0;
  const [phase, setPhase] = useState<OverlayPhase>(
    hasRewards ? "rewards" : "navigate",
  );

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      className={[
        "bg-background/90 absolute inset-0 z-10 flex items-center justify-center",
        "transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <Stack gap={8} align="center">
        {/* Result header — always visible */}
        <Stack gap={2} align="center">
          <p className="text-foreground font-mono text-sm tracking-[0.3em] uppercase">
            {playerWon ? "Victory" : "Defeat"}
          </p>
          <p className="text-muted text-xs">
            {playerWon
              ? `${encounterName} has been defeated.`
              : "You have been defeated."}
          </p>
        </Stack>

        {/* Reward cards — shown only during rewards phase */}
        {phase === "rewards" && (
          <Stack gap={4} align="center">
            <p className="text-muted text-xs tracking-[0.3em] uppercase">
              Unlocked
            </p>
            <div className="flex gap-3">
              {rewardCardDefinitions.map((def) => (
                <RewardCard key={String(def.id)} definition={def} />
              ))}
            </div>
          </Stack>
        )}

        {/* Actions */}
        {phase === "rewards" ? (
          <button
            type="button"
            onClick={() => setPhase("navigate")}
            autoFocus
            className="border-foreground text-foreground hover:bg-surface cursor-pointer border px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase"
          >
            Continue
          </button>
        ) : (
          <Stack direction="row" gap={3}>
            <button
              type="button"
              onClick={onLeave}
              autoFocus
              className="border-foreground text-foreground hover:bg-surface cursor-pointer border px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase"
            >
              Menu
            </button>
            {onReplay && (
              <button
                type="button"
                onClick={onReplay}
                className="border-border text-muted hover:bg-surface cursor-pointer border px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase"
              >
                {replayLabel ?? "Replay"}
              </button>
            )}
          </Stack>
        )}
      </Stack>
    </div>
  );
}
