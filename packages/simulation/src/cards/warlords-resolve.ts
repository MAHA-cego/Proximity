import {
  AbilityTrigger,
  Comparison,
  EffectType,
  RequirementType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";

export const WARLORDS_RESOLVE_ID = "warlords-resolve" as CardDefinitionId;

export const WarlordsResolve: CardDefinition = {
  id: WARLORDS_RESOLVE_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        {
          type: EffectType.Conditional,
          condition: {
            type: RequirementType.Health,
            comparison: Comparison.Below,
            threshold: 8,
          },
          effects: [{ type: EffectType.Heal, amount: 8 }],
        },
        { type: EffectType.Heal, amount: 4 },
      ],
    },
  ],
};
