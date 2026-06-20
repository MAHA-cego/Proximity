import {
  AbilityTrigger,
  Comparison,
  EffectType,
  RequirementSubject,
  RequirementType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const EXECUTE_ID = "execute" as CardDefinitionId;

export const Execute: CardDefinition = {
  id: EXECUTE_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [{ type: EffectType.Damage, amount: 20 }],
      requirements: [
        {
          type: RequirementType.Health,
          comparison: Comparison.Below,
          threshold: 5,
          subject: RequirementSubject.Enemy,
        },
      ],
    },
  ],
};
