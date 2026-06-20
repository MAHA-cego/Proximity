import {
  AbilityTrigger,
  EffectType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";
import { FINISHING_BLOW_ID } from "./finishing-blow";

export const TACTICAL_BURST_ID = "tactical-burst" as CardDefinitionId;

export const TacticalBurst: CardDefinition = {
  id: TACTICAL_BURST_ID,
  cooldown: 1,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.SingleEnemy },
      effects: [{ type: EffectType.Damage, amount: 8 }],
    },
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        {
          type: EffectType.ReduceCooldown,
          cardDefinitionId: FINISHING_BLOW_ID,
          amount: 1,
        },
      ],
    },
  ],
};
