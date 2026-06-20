import {
  AbilityTrigger,
  EffectType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const BASIC_STRIKE_ID = "basic-strike" as CardDefinitionId;

export const BasicStrike: CardDefinition = {
  id: BASIC_STRIKE_ID,
  cooldown: 1,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [{ type: EffectType.Damage, amount: 6 }],
    },
  ],
};
