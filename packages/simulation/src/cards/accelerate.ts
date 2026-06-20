import {
  AbilityTrigger,
  EffectType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";
import { BASIC_STRIKE_ID } from "./basic-strike";

export const ACCELERATE_ID = "accelerate" as CardDefinitionId;

export const Accelerate: CardDefinition = {
  id: ACCELERATE_ID,
  cooldown: 1,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: {
        type: TargetingType.Card,
        cardDefinitionId: BASIC_STRIKE_ID,
      },
      effects: [{ type: EffectType.ReduceCooldown, amount: 1 }],
    },
  ],
};
