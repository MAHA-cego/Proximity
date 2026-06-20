import {
  AbilityTrigger,
  Comparison,
  EffectType,
  RequirementType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const EMERGENCY_TREATMENT_ID = "emergency-treatment" as CardDefinitionId;

export const EmergencyTreatment: CardDefinition = {
  id: EMERGENCY_TREATMENT_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [{ type: EffectType.Heal, amount: 12 }],
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
