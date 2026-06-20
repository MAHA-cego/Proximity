import {
  AbilityTrigger,
  EffectType,
  StatusType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const IGNITE_ID = "ignite" as CardDefinitionId;

export const Ignite: CardDefinition = {
  id: IGNITE_ID,
  cooldown: 1,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [
        {
          type: EffectType.ApplyStatus,
          statusType: StatusType.Burn,
          duration: 3,
          amount: 2,
        },
      ],
    },
  ],
};
