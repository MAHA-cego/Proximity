import {
  AbilityTrigger,
  EffectType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const CHAIN_LIGHTNING_ID = "chain-lightning" as CardDefinitionId;

export const ChainLightning: CardDefinition = {
  id: CHAIN_LIGHTNING_ID,
  cooldown: 3,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.AllEnemies },
      effects: [{ type: EffectType.Damage, amount: 6 }],
    },
  ],
};
