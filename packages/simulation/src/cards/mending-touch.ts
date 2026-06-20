import {
  AbilityTrigger,
  EffectType,
  StatusType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const MENDING_TOUCH_ID = "mending-touch" as CardDefinitionId;

export const MendingTouch: CardDefinition = {
  id: MENDING_TOUCH_ID,
  cooldown: 1,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        {
          type: EffectType.ApplyStatus,
          statusType: StatusType.Regeneration,
          duration: 2,
          amount: 3,
        },
      ],
    },
  ],
};
