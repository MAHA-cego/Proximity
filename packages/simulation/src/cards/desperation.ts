import {
  AbilityTrigger,
  Comparison,
  EffectType,
  RequirementType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const DESPERATION_ID = "desperation" as CardDefinitionId;

export const Desperation: CardDefinition = {
  id: DESPERATION_ID,
  cooldown: 1,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [{ type: EffectType.Damage, amount: 15 }],
      requirements: [
        {
          type: RequirementType.Health,
          comparison: Comparison.Below,
          threshold: 10,
        },
      ],
    },
  ],
};
