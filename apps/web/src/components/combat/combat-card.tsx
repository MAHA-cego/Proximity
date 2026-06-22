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
  readonly onHoverStart?: () => void;
  readonly onHoverEnd?: () => void;
}

export function CombatCard({
  definitionId,
  remainingCooldown,
  isPlayable,
  onPlay,
  onHoverStart,
  onHoverEnd,
}: CombatCardProps) {
  const onCooldown = remainingCooldown > 0;

  return (
    <button
      type="button"
      onClick={isPlayable ? onPlay : undefined}
      aria-disabled={!isPlayable}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      className={[
        "group w-28 text-left",
        isPlayable ? "cursor-pointer" : "cursor-not-allowed opacity-50",
      ].join(" ")}
    >
      <div
        className={[
          "flex flex-col border",
          isPlayable
            ? "bg-surface border-foreground group-hover:bg-surface-raised"
            : "bg-surface border-border",
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
                Ready in {remainingCooldown}
              </p>
            )}
          </Stack>
        </div>
      </div>
    </button>
  );
}
