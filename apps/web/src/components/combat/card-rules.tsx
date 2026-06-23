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
  type CardEffect,
  type Targeting,
} from "@proximity/simulation";
import { Stack } from "@/components/ui";

function formatStatusName(type: StatusType): string {
  return String(type)
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatTrigger(trigger: AbilityTrigger): string {
  switch (trigger) {
    case AbilityTrigger.OnUse:
      return "On Use";
    case AbilityTrigger.OnTurnStart:
      return "On Turn Start";
    case AbilityTrigger.Passive:
      return "Passive";
    case AbilityTrigger.OnOpponentCardUse:
      return "Reaction";
  }
}

export function formatTargeting(targeting: Targeting): string {
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
      return String(targeting.cardDefinitionId)
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
}

function formatRequirement(req: AbilityRequirement): string {
  switch (req.type) {
    case RequirementType.Health: {
      const subject =
        req.subject === RequirementSubject.Enemy ? "Enemy" : "Your";
      const comp =
        req.comparison === Comparison.Below
          ? "<"
          : req.comparison === Comparison.BelowOrEqual
            ? "≤"
            : ">";
      return `${subject} hp ${comp} ${req.threshold}`;
    }
    case RequirementType.Status:
      return `Has ${formatStatusName(req.statusType)}`;
    case RequirementType.CardUsed:
      return req.cardDefinitionIds
        .map((id) =>
          String(id)
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        )
        .join(" or ");
  }
}

const MODIFIER_LABELS: Record<ModifierType, string> = {
  [ModifierType.Damage]: "Damage",
  [ModifierType.DamageMultiplier]: "Damage Mult",
  [ModifierType.Heal]: "Heal",
};

export function effectLines(effect: CardEffect): string[] {
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

interface CardRulesProps {
  readonly definition: CardDefinition;
}

export function CardRules({ definition }: CardRulesProps) {
  return (
    <Stack gap={2}>
      {definition.abilities.map((ability, i) => {
        const triggerLabel = formatTrigger(ability.trigger);
        const lines = ability.effects.flatMap((e) => effectLines(e));

        const showTrigger = ability.trigger !== AbilityTrigger.OnUse;

        return (
          <Stack key={i} gap={2}>
            {ability.requirements && ability.requirements.length > 0 && (
              <Stack gap={1}>
                {ability.requirements.map((req, j) => (
                  <p key={j} className="text-muted font-mono text-xs">
                    {formatRequirement(req)}
                  </p>
                ))}
              </Stack>
            )}
            {showTrigger && (
              <p className="text-muted text-xs tracking-[0.3em] uppercase">
                {triggerLabel}
              </p>
            )}
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
