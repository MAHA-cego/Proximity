import {
  AbilityTrigger,
  EffectType,
  StatusType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const RECOVER_ID = "recover" as CardDefinitionId;

export const Recover: CardDefinition = {
  id: RECOVER_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        { type: EffectType.Heal, amount: 10 },
        { type: EffectType.RemoveStatus, statusType: StatusType.Bleeding },
      ],
    },
  ],
};
