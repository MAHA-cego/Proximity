import {
  EffectType,
  ModifierType,
  StatusType,
  type CardDefinition,
  type CardEffect,
} from "@proximity/simulation";

type CardColor = "crimson" | "amber" | "emerald" | "azure" | "violet";

function scoreEffect(
  effect: CardEffect,
  scores: Record<CardColor, number>,
): void {
  switch (effect.type) {
    case EffectType.Damage:
      scores.crimson++;
      break;
    case EffectType.Heal:
      scores.emerald++;
      break;
    case EffectType.ApplyStatus:
      switch (effect.statusType) {
        case StatusType.Bleeding:
        case StatusType.Burn:
          scores.crimson++;
          break;
        case StatusType.Berserk:
          scores.amber++;
          break;
        case StatusType.Parry:
        case StatusType.Shield:
          scores.azure++;
          break;
        case StatusType.Regeneration:
          scores.emerald++;
          break;
        case StatusType.FeintActive:
        case StatusType.Opening:
        case StatusType.Exhausted:
          scores.violet++;
          break;
      }
      break;
    case EffectType.RemoveStatus:
      scores.emerald++;
      break;
    case EffectType.ApplyModifier:
      if (effect.modifierType === ModifierType.Heal) {
        scores.emerald++;
      } else {
        scores.amber++;
      }
      break;
    case EffectType.ReduceCooldown:
    case EffectType.RefreshCooldown:
      scores.azure++;
      break;
    case EffectType.ExtendCooldown:
      scores.violet++;
      break;
    case EffectType.Conditional:
      for (const e of effect.effects) scoreEffect(e, scores);
      break;
    case EffectType.Group:
      for (const e of effect.effects) scoreEffect(e, scores);
      break;
  }
}

export function cardPrimaryColor(definition: CardDefinition): CardColor {
  const scores: Record<CardColor, number> = {
    crimson: 0,
    amber: 0,
    emerald: 0,
    azure: 0,
    violet: 0,
  };

  for (const ability of definition.abilities) {
    for (const effect of ability.effects) {
      scoreEffect(effect, scores);
    }
  }

  let best: CardColor = "crimson";
  let bestScore = -1;
  for (const [color, score] of Object.entries(scores) as [
    CardColor,
    number,
  ][]) {
    if (score > bestScore) {
      bestScore = score;
      best = color;
    }
  }

  return best;
}

// Full class strings required for Tailwind scanning
export const CARD_BORDER_CLASS: Record<CardColor, string> = {
  crimson: "border-crimson",
  amber: "border-amber",
  emerald: "border-emerald",
  azure: "border-azure",
  violet: "border-violet",
};

export const CARD_HOVER_BORDER_CLASS: Record<CardColor, string> = {
  crimson: "hover:border-crimson",
  amber: "hover:border-amber",
  emerald: "hover:border-emerald",
  azure: "hover:border-azure",
  violet: "hover:border-violet",
};
