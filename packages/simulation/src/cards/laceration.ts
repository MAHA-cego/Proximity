import {
  AbilityTrigger,
  EffectType,
  StatusType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const LACERATION_ID = "laceration" as CardDefinitionId;

export const Laceration: CardDefinition = {
  id: LACERATION_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [
        { type: EffectType.Damage, amount: 4 },
        {
          type: EffectType.ApplyStatus,
          statusType: StatusType.Bleeding,
          duration: 5,
          amount: 3,
        },
      ],
    },
  ],
};
