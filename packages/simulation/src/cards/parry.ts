import {
  AbilityTrigger,
  EffectType,
  StatusType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const PARRY_ID = "parry" as CardDefinitionId;

export const Parry: CardDefinition = {
  id: PARRY_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        {
          type: EffectType.ApplyStatus,
          statusType: StatusType.Parry,
          duration: 1,
          amount: 15,
        },
      ],
    },
  ],
};
