export type EntryAlignment = "player" | "opponent" | "neutral";

interface CombatLogEntryProps {
  readonly children: React.ReactNode;
  readonly align?: EntryAlignment;
}

export function CombatLogEntry({
  children,
  align = "neutral",
}: CombatLogEntryProps) {
  if (align === "player") {
    return (
      <p className="text-muted pr-[30%] font-mono text-xs">
        <span className="mr-2 select-none">—</span>
        {children}
      </p>
    );
  }
  if (align === "opponent") {
    return (
      <p className="text-muted pl-[30%] text-right font-mono text-xs">
        {children}
        <span className="ml-2 select-none">—</span>
      </p>
    );
  }
  return <p className="text-muted text-center font-mono text-xs">{children}</p>;
}
