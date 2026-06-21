import {
  AbilityTrigger,
  EffectType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const HEAVY_STRIKE_ID = "heavy-strike" as CardDefinitionId;

export const HeavyStrike: CardDefinition = {
  id: HEAVY_STRIKE_ID,
  cooldown: 4,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [{ type: EffectType.Damage, amount: 22 }],
    },
  ],
};
