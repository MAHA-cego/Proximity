import {
  AbilityTrigger,
  Comparison,
  EffectType,
  RequirementType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const FINISHING_BLOW_ID = "finishing-blow" as CardDefinitionId;

export const FinishingBlow: CardDefinition = {
  id: FINISHING_BLOW_ID,
  cooldown: 1,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [{ type: EffectType.Damage, amount: 22 }],
      requirements: [
        {
          type: RequirementType.Health,
          comparison: Comparison.Below,
          threshold: 8,
        },
      ],
    },
  ],
};
