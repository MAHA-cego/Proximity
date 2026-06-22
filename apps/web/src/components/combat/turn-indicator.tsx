interface TurnIndicatorProps {
  readonly turnNumber: number;
  readonly isPlayerTurn: boolean;
  readonly isCompleted: boolean;
}

export function TurnIndicator({
  turnNumber,
  isPlayerTurn,
  isCompleted,
}: TurnIndicatorProps) {
  const label = isCompleted
    ? "Match ended"
    : `Turn ${turnNumber} — ${isPlayerTurn ? "Your turn" : "Opponent's turn"}`;

  return (
    <p className="text-muted text-xs tracking-[0.3em] uppercase">{label}</p>
  );
}
