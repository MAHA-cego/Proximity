import type { CardDefinition, CardDefinitionId } from "@proximity/simulation";
import { CardRules } from "./card-rules";

function formatCardName(id: CardDefinitionId): string {
  return String(id)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface CombatCardProps {
  readonly cardDefinition: CardDefinition;
  readonly remainingCooldown: number;
  readonly isPlayable: boolean;
  readonly lockedByRequirements: boolean;
  readonly onPlay: () => void;
}

export function CombatCard({
  cardDefinition,
  remainingCooldown,
  isPlayable,
  lockedByRequirements,
  onPlay,
}: CombatCardProps) {
  const onCooldown = remainingCooldown > 0;

  return (
    <button
      type="button"
      onClick={(e) => {
        if (isPlayable) onPlay();
        (e.currentTarget as HTMLButtonElement).blur();
      }}
      aria-disabled={!isPlayable}
      className={[
        "group h-80 w-36 text-left",
        "transition-transform duration-200",
        isPlayable
          ? "cursor-pointer focus-within:-translate-y-48 hover:-translate-y-48"
          : "cursor-not-allowed opacity-50",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-full flex-col border",
          isPlayable
            ? "bg-surface border-foreground"
            : "bg-surface border-border",
        ].join(" ")}
      >
        {/* Card Name */}
        <div className="border-border flex h-8 shrink-0 items-center border-b px-3">
          <p className="text-foreground truncate font-mono text-xs">
            {formatCardName(cardDefinition.id)}
          </p>
        </div>

        {/* Illustration */}
        <div className="bg-surface-raised border-border h-24 w-full shrink-0 border-b" />

        {/* Cooldown / lock state */}
        <div className="border-border flex h-7 shrink-0 items-center border-b px-3">
          {onCooldown ? (
            <p className="text-crimson font-mono text-xs">
              cd {remainingCooldown}
            </p>
          ) : lockedByRequirements ? (
            <p className="text-muted font-mono text-xs">locked</p>
          ) : (
            <p className="text-muted font-mono text-xs">
              {cardDefinition.cooldown > 0
                ? `cd ${cardDefinition.cooldown}`
                : "—"}
            </p>
          )}
        </div>

        {/* Rules */}
        <div className="flex-1 overflow-hidden px-3 py-2">
          <CardRules definition={cardDefinition} />
        </div>
      </div>
    </button>
  );
}
