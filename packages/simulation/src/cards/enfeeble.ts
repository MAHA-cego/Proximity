import {
  AbilityTrigger,
  EffectType,
  ModifierType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const ENFEEBLE_ID = "enfeeble" as CardDefinitionId;

export const Enfeeble: CardDefinition = {
  id: ENFEEBLE_ID,
  cooldown: 1,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [
        {
          type: EffectType.ApplyModifier,
          modifierType: ModifierType.Heal,
          amount: -3,
          uses: 1,
        },
      ],
    },
  ],
};
