import {
  AbilityTrigger,
  EffectType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";
import { FINISHING_BLOW_ID } from "./finishing-blow";

export const ADRENALINE_RUSH_ID = "adrenaline-rush" as CardDefinitionId;

export const AdrenalineRush: CardDefinition = {
  id: ADRENALINE_RUSH_ID,
  cooldown: 3,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        {
          type: EffectType.RefreshCooldown,
          cardDefinitionId: FINISHING_BLOW_ID,
        },
      ],
    },
  ],
};
