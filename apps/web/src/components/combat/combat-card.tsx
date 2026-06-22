import type { CardDefinitionId } from "@proximity/simulation";
import { Stack } from "@/components/ui";

function formatCardName(id: CardDefinitionId): string {
  return String(id)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface CombatCardProps {
  readonly definitionId: CardDefinitionId;
  readonly remainingCooldown: number;
  readonly isPlayable: boolean;
  readonly onPlay: () => void;
}

export function CombatCard({
  definitionId,
  remainingCooldown,
  isPlayable,
  onPlay,
}: CombatCardProps) {
  const onCooldown = remainingCooldown > 0;

  return (
    <button
      onClick={onPlay}
      disabled={!isPlayable}
      className={[
        "w-28 text-left transition-opacity",
        isPlayable ? "cursor-pointer" : "cursor-not-allowed opacity-50",
      ].join(" ")}
    >
      <div
        className={[
          "bg-surface flex flex-col border",
          isPlayable ? "border-foreground" : "border-border",
        ].join(" ")}
      >
        {/* Placeholder artwork — replaced with illustration in production */}
        <div className="bg-surface-raised h-20 w-full" />

        {/* Card info */}
        <div className="border-border border-t px-3 py-2.5">
          <Stack gap={1}>
            <p
              className={[
                "font-mono text-xs",
                isPlayable ? "text-foreground" : "text-muted",
              ].join(" ")}
            >
              {formatCardName(definitionId)}
            </p>
            {onCooldown && (
              <p className="text-muted font-mono text-xs">
                {remainingCooldown} turn{remainingCooldown !== 1 ? "s" : ""}
              </p>
            )}
          </Stack>
        </div>
      </div>
    </button>
  );
}
