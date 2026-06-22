interface MatchOverlayProps {
  readonly playerWon: boolean;
  readonly encounterName: string;
}

export function MatchOverlay({ playerWon, encounterName }: MatchOverlayProps) {
  return (
    <div className="bg-background/90 absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
      <p className="text-foreground font-mono text-sm tracking-[0.3em] uppercase">
        {playerWon ? "Victory" : "Defeat"}
      </p>
      <p className="text-muted text-xs">
        {playerWon
          ? `${encounterName} has been defeated.`
          : "You have been defeated."}
      </p>
    </div>
  );
}
