import {
  AbilityTrigger,
  Comparison,
  EffectType,
  ModifierType,
  RequirementSubject,
  RequirementType,
  StatusType,
  TargetingType,
  type AbilityRequirement,
  type CardDefinition,
  type CardDefinitionId,
  type CardEffect,
  type Targeting,
} from "@proximity/simulation";
import { Stack } from "@/components/ui";

function formatCardName(id: CardDefinitionId): string {
  return String(id)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatStatusName(type: StatusType): string {
  return String(type)
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatTrigger(trigger: AbilityTrigger): string {
  switch (trigger) {
    case AbilityTrigger.OnUse:
      return "On Use";
    case AbilityTrigger.OnTurnStart:
      return "On Turn Start";
    case AbilityTrigger.Passive:
      return "Passive";
    case AbilityTrigger.OnOpponentCardUse:
      return "On Opponent Card Use";
  }
}

function formatTargeting(targeting: Targeting): string {
  switch (targeting.type) {
    case TargetingType.None:
      return "";
    case TargetingType.Self:
      return "Self";
    case TargetingType.SingleEnemy:
      return "Enemy";
    case TargetingType.AllEnemies:
      return "All Enemies";
    case TargetingType.Card:
      return formatCardName(targeting.cardDefinitionId);
  }
}

function formatRequirement(req: AbilityRequirement): string {
  switch (req.type) {
    case RequirementType.Health: {
      const subject =
        req.subject === RequirementSubject.Enemy ? "Enemy" : "Your";
      const comp =
        req.comparison === Comparison.Below
          ? "below"
          : req.comparison === Comparison.BelowOrEqual
            ? "at most"
            : "above";
      return `${subject} health ${comp} ${req.threshold}`;
    }
    case RequirementType.Status:
      return `Has ${formatStatusName(req.statusType)}`;
    case RequirementType.CardUsed:
      return `After using ${req.cardDefinitionIds.map(formatCardName).join(" or ")}`;
  }
}

const MODIFIER_LABELS: Record<ModifierType, string> = {
  [ModifierType.Damage]: "Damage",
  [ModifierType.DamageMultiplier]: "Damage Mult",
  [ModifierType.Heal]: "Heal",
};

function effectLines(effect: CardEffect): string[] {
  switch (effect.type) {
    case EffectType.Damage:
      return [`Deal ${effect.amount} damage`];
    case EffectType.Heal:
      return [`Heal ${effect.amount} HP`];
    case EffectType.ApplyStatus: {
      const name = formatStatusName(effect.statusType);
      const amtStr = effect.amount > 0 ? ` ${effect.amount}` : "";
      return [`Apply ${name}${amtStr} for ${effect.duration} turns`];
    }
    case EffectType.ApplyModifier: {
      const label = MODIFIER_LABELS[effect.modifierType];
      const amtStr =
        effect.modifierType === ModifierType.DamageMultiplier
          ? `×${effect.amount}`
          : `+${effect.amount}`;
      const usesStr =
        effect.uses !== undefined
          ? ` for ${effect.uses} use${effect.uses !== 1 ? "s" : ""}`
          : "";
      const durStr =
        effect.duration !== undefined ? ` (${effect.duration} turns)` : "";
      return [`${label} ${amtStr}${usesStr}${durStr}`];
    }
    case EffectType.RemoveStatus:
      return [`Remove ${formatStatusName(effect.statusType)}`];
    case EffectType.ReduceCooldown:
      return [`Reduce cooldown by ${effect.amount}`];
    case EffectType.RefreshCooldown:
      return ["Refresh cooldown"];
    case EffectType.ExtendCooldown:
      return [`Extend cooldown by ${effect.amount}`];
    case EffectType.Conditional: {
      const cond = formatRequirement(effect.condition);
      const inner = effect.effects.flatMap((e) => effectLines(e)).join(", ");
      return [`If ${cond}: ${inner}`];
    }
    case EffectType.Group:
      return effect.effects.flatMap((e) => effectLines(e));
  }
}

interface ContextPanelProps {
  readonly cardDefinition: CardDefinition | null;
  readonly encounterName: string;
}

export function ContextPanel({
  cardDefinition,
  encounterName,
}: ContextPanelProps) {
  if (!cardDefinition) {
    return (
      <Stack gap={1}>
        <p className="text-muted text-xs tracking-[0.3em] uppercase">
          Encounter
        </p>
        <p className="text-foreground font-mono text-sm">{encounterName}</p>
      </Stack>
    );
  }

  const name = formatCardName(cardDefinition.id);
  const cooldownLabel =
    cardDefinition.cooldown === 0
      ? "No cooldown"
      : `Cooldown ${cardDefinition.cooldown}`;

  return (
    <Stack gap={3}>
      <Stack direction="row" align="center" justify="between">
        <p className="text-foreground font-mono text-sm">{name}</p>
        <p className="text-muted font-mono text-xs">{cooldownLabel}</p>
      </Stack>

      {cardDefinition.abilities.map((ability, i) => {
        const triggerLabel = formatTrigger(ability.trigger);
        const targetLabel = formatTargeting(ability.targeting);
        const triggerLine = targetLabel
          ? `${triggerLabel} — ${targetLabel}`
          : triggerLabel;
        const lines = ability.effects.flatMap((e) => effectLines(e));

        return (
          <Stack key={i} gap={2}>
            {ability.requirements && ability.requirements.length > 0 && (
              <Stack gap={1}>
                {ability.requirements.map((req, j) => (
                  <p key={j} className="text-muted font-mono text-xs">
                    Requires: {formatRequirement(req)}
                  </p>
                ))}
              </Stack>
            )}
            <p className="text-muted text-xs tracking-[0.3em] uppercase">
              {triggerLine}
            </p>
            <Stack gap={1}>
              {lines.map((line, k) => (
                <p key={k} className="text-foreground font-mono text-xs">
                  {line}
                </p>
              ))}
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}
