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

export const PREDATORY_STRIKE_ID = "predatory-strike" as CardDefinitionId;

export const PredatoryStrike: CardDefinition = {
  id: PREDATORY_STRIKE_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [
        { type: EffectType.Damage, amount: 5 },
        {
          type: EffectType.Conditional,
          condition: {
            type: RequirementType.Health,
            subject: RequirementSubject.Enemy,
            comparison: Comparison.Below,
            threshold: 10,
          },
          effects: [{ type: EffectType.Damage, amount: 10 }],
        },
      ],
    },
  ],
};
