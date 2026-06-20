import {
  AbilityTrigger,
  EffectType,
  StatusType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const IRON_WILL_ID = "iron-will" as CardDefinitionId;

export const IronWill: CardDefinition = {
  id: IRON_WILL_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        {
          type: EffectType.ApplyStatus,
          statusType: StatusType.Shield,
          duration: 2,
          amount: 5,
        },
      ],
    },
  ],
};
