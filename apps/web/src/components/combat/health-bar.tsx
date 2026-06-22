import { Stack } from "@/components/ui";

interface HealthBarProps {
  readonly current: number;
  readonly max: number;
}

export function HealthBar({ current, max }: HealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  const barColor = percentage <= 25 ? "bg-crimson" : "bg-foreground";

  return (
    <Stack gap={1.5}>
      <div className="bg-surface-raised h-1.5 w-full">
        <div
          className={`${barColor} h-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-muted font-mono text-xs">
        {current} / {max} hp
      </p>
    </Stack>
  );
}
