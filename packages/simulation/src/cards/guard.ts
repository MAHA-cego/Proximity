import {
  AbilityTrigger,
  EffectType,
  StatusType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const GUARD_ID = "guard" as CardDefinitionId;

export const Guard: CardDefinition = {
  id: GUARD_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        {
          type: EffectType.ApplyStatus,
          statusType: StatusType.Shield,
          duration: 1,
          amount: 15,
        },
      ],
    },
  ],
};
