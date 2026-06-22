interface CombatLogEntryProps {
  readonly text: string;
}

export function CombatLogEntry({ text }: CombatLogEntryProps) {
  return (
    <p className="text-muted font-mono text-xs">
      <span className="mr-2 select-none">—</span>
      {text}
    </p>
  );
}
