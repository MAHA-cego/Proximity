import {
  AbilityTrigger,
  Comparison,
  EffectType,
  ModifierType,
  RequirementType,
  StatusType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";
import { GUARD_ID } from "./guard";
import { RECOVER_ID } from "./recover";
import { REGENERATION_ID } from "./regeneration";

export const BERSERK_ID = "berserk" as CardDefinitionId;

export const Berserk: CardDefinition = {
  id: BERSERK_ID,
  cooldown: 4,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      requirements: [
        {
          type: RequirementType.Health,
          comparison: Comparison.Below,
          threshold: 30,
        },
      ],
      effects: [
        {
          type: EffectType.ApplyStatus,
          statusType: StatusType.Berserk,
          duration: 3,
          amount: 0,
          restrictedCardIds: [GUARD_ID, RECOVER_ID, REGENERATION_ID],
          onExpiry: [
            {
              type: EffectType.ApplyStatus,
              statusType: StatusType.Exhausted,
              duration: 1,
              amount: 0,
              preventsCardPlay: true,
            },
          ],
        },
        {
          type: EffectType.ApplyModifier,
          modifierType: ModifierType.DamageMultiplier,
          amount: 2,
          duration: 3,
        },
      ],
    },
  ],
};
