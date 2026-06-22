interface TurnIndicatorProps {
  readonly roundNumber: number;
  readonly isCompleted: boolean;
}

export function TurnIndicator({
  roundNumber,
  isCompleted,
}: TurnIndicatorProps) {
  const label = isCompleted ? "Match ended" : `Round ${roundNumber}`;

  return (
    <p className="text-muted text-xs tracking-[0.3em] uppercase">{label}</p>
  );
}
