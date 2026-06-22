import { Stack } from "@/components/ui";

interface HealthBarProps {
  readonly current: number;
  readonly max: number;
}

export function HealthBar({ current, max }: HealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <Stack gap={1.5}>
      <div className="bg-surface-raised h-1.5 w-full">
        <div
          className="bg-foreground h-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-muted font-mono text-xs">
        {current} / {max} hp
      </p>
    </Stack>
  );
}
