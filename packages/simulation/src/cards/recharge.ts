import {
  AbilityTrigger,
  EffectType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";
import { BASIC_STRIKE_ID } from "./basic-strike";

export const RECHARGE_ID = "recharge" as CardDefinitionId;

export const Recharge: CardDefinition = {
  id: RECHARGE_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: {
        type: TargetingType.Card,
        cardDefinitionId: BASIC_STRIKE_ID,
      },
      effects: [{ type: EffectType.RefreshCooldown }],
    },
  ],
};
