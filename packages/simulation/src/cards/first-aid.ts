import {
  AbilityTrigger,
  EffectType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const FIRST_AID_ID = "first-aid" as CardDefinitionId;

export const FirstAid: CardDefinition = {
  id: FIRST_AID_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [{ type: EffectType.Heal, amount: 8 }],
    },
  ],
};
