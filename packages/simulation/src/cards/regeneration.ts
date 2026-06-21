import {
  AbilityTrigger,
  EffectType,
  StatusType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const REGENERATION_ID = "regeneration" as CardDefinitionId;

export const Regeneration: CardDefinition = {
  id: REGENERATION_ID,
  cooldown: 4,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        {
          type: EffectType.ApplyStatus,
          statusType: StatusType.Regeneration,
          duration: 5,
          amount: 4,
        },
      ],
    },
  ],
};
