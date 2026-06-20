import {
  AbilityTrigger,
  EffectType,
  ModifierType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const BATTLE_CRY_ID = "battle-cry" as CardDefinitionId;

export const BattleCry: CardDefinition = {
  id: BATTLE_CRY_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        {
          type: EffectType.ApplyModifier,
          modifierType: ModifierType.Damage,
          amount: 5,
          uses: 1,
        },
      ],
    },
  ],
};
