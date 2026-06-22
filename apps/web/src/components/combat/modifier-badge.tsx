import { ModifierType } from "@proximity/simulation";
import type { RuntimeModifier } from "@proximity/simulation";

const MODIFIER_COLORS: Record<ModifierType, string> = {
  [ModifierType.Damage]: "border-amber text-amber",
  [ModifierType.DamageMultiplier]: "border-amber text-amber",
  [ModifierType.Heal]: "border-emerald text-emerald",
};

const MODIFIER_LABELS: Record<ModifierType, string> = {
  [ModifierType.Damage]: "Damage",
  [ModifierType.DamageMultiplier]: "Dmg Mult",
  [ModifierType.Heal]: "Heal",
};

function formatAmount(modifier: RuntimeModifier): string {
  if (modifier.type === ModifierType.DamageMultiplier) {
    return `×${modifier.amount}`;
  }
  return `+${modifier.amount}`;
}

function formatSuffix(modifier: RuntimeModifier): string {
  if (modifier.remainingUses !== undefined) {
    return ` · ${modifier.remainingUses}×`;
  }
  if (modifier.remainingDuration !== undefined) {
    return ` · ${modifier.remainingDuration}t`;
  }
  return "";
}

interface ModifierBadgeProps {
  readonly modifier: RuntimeModifier;
}

export function ModifierBadge({ modifier }: ModifierBadgeProps) {
  const colors = MODIFIER_COLORS[modifier.type];
  const label = MODIFIER_LABELS[modifier.type];
  const amount = formatAmount(modifier);
  const suffix = formatSuffix(modifier);

  return (
    <span className={`border px-1.5 py-0.5 font-mono text-xs ${colors}`}>
      {label} {amount}
      {suffix}
    </span>
  );
}
