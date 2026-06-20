import {
  AbilityTrigger,
  EffectType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const VOLLEY_ID = "volley" as CardDefinitionId;

export const Volley: CardDefinition = {
  id: VOLLEY_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.AllEnemies },
      effects: [{ type: EffectType.Damage, amount: 4 }],
    },
  ],
};
