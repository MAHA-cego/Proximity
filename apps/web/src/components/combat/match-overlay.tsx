import { Stack } from "@/components/ui";

interface MatchOverlayProps {
  readonly playerWon: boolean;
  readonly encounterName: string;
  readonly onReplay: () => void;
  readonly onLeave: () => void;
}

export function MatchOverlay({
  playerWon,
  encounterName,
  onReplay,
  onLeave,
}: MatchOverlayProps) {
  return (
    <div className="bg-background/90 absolute inset-0 z-10 flex items-center justify-center">
      <Stack gap={6} align="center">
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

        <Stack direction="row" gap={3}>
          <button
            type="button"
            onClick={onReplay}
            autoFocus
            className="border-foreground text-foreground hover:bg-surface cursor-pointer border px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase"
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="border-border text-muted hover:bg-surface cursor-pointer border px-4 py-2 font-mono text-xs tracking-[0.3em] uppercase"
          >
            Encounters
          </button>
        </Stack>
      </Stack>
    </div>
  );
}
