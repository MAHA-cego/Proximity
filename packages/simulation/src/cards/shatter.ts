import {
  AbilityTrigger,
  Comparison,
  EffectType,
  ModifierType,
  RequirementSubject,
  RequirementType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const SHATTER_ID = "shatter" as CardDefinitionId;

export const Shatter: CardDefinition = {
  id: SHATTER_ID,
  cooldown: 3,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [
        {
          type: EffectType.Group,
          effects: [
            { type: EffectType.Damage, amount: 6 },
            {
              type: EffectType.ApplyModifier,
              modifierType: ModifierType.Heal,
              amount: -4,
              uses: 1,
            },
          ],
        },
        {
          type: EffectType.Conditional,
          condition: {
            type: RequirementType.Health,
            subject: RequirementSubject.Enemy,
            comparison: Comparison.Below,
            threshold: 12,
          },
          effects: [{ type: EffectType.Damage, amount: 6 }],
        },
      ],
    },
  ],
};
