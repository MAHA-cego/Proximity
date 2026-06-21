import {
  AbilityTrigger,
  EffectType,
  ModifierType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const PREPARATION_ID = "preparation" as CardDefinitionId;

export const Preparation: CardDefinition = {
  id: PREPARATION_ID,
  cooldown: 4,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        {
          type: EffectType.ApplyModifier,
          modifierType: ModifierType.Damage,
          amount: 15,
          uses: 1,
          duration: 2,
        },
      ],
    },
  ],
};
