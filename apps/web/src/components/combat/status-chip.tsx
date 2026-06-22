import { StatusType } from "@proximity/simulation";
import type { RuntimeStatus } from "@proximity/simulation";

const STATUS_COLORS: Record<StatusType, string> = {
  [StatusType.Berserk]: "border-crimson text-crimson",
  [StatusType.Bleeding]: "border-crimson text-crimson",
  [StatusType.Burn]: "border-crimson text-crimson",
  [StatusType.Exhausted]: "border-border text-muted",
  [StatusType.FeintActive]: "border-violet text-violet",
  [StatusType.Opening]: "border-violet text-violet",
  [StatusType.Parry]: "border-azure text-azure",
  [StatusType.Regeneration]: "border-emerald text-emerald",
  [StatusType.Shield]: "border-azure text-azure",
};

function formatStatusName(type: StatusType): string {
  return String(type)
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface StatusChipProps {
  readonly status: RuntimeStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const colors = STATUS_COLORS[status.type];
  const name = formatStatusName(status.type);
  const label =
    status.amount > 0
      ? `${name} ${status.amount} · ${status.remainingDuration}t`
      : `${name} · ${status.remainingDuration}t`;

  return (
    <span className={`border px-1.5 py-0.5 font-mono text-xs ${colors}`}>
      {label}
    </span>
  );
}
