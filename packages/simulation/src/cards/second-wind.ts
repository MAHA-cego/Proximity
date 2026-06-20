import {
  AbilityTrigger,
  EffectType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";
import { BASIC_STRIKE_ID } from "./basic-strike";

export const SECOND_WIND_ID = "second-wind" as CardDefinitionId;

export const SecondWind: CardDefinition = {
  id: SECOND_WIND_ID,
  cooldown: 3,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        { type: EffectType.RefreshCooldown, cardDefinitionId: BASIC_STRIKE_ID },
      ],
    },
  ],
};
