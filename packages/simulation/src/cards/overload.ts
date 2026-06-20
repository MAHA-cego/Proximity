import {
  AbilityTrigger,
  EffectType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";
import { BASIC_STRIKE_ID } from "./basic-strike";

export const OVERLOAD_ID = "overload" as CardDefinitionId;

export const Overload: CardDefinition = {
  id: OVERLOAD_ID,
  cooldown: 0,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: {
        type: TargetingType.Card,
        cardDefinitionId: BASIC_STRIKE_ID,
      },
      effects: [{ type: EffectType.ExtendCooldown, amount: 2 }],
    },
  ],
};
