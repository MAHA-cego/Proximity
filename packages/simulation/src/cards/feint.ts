import {
  AbilityTrigger,
  EffectType,
  RequirementSubject,
  RequirementType,
  StatusType,
  TargetingType,
  type CardDefinition,
  type CardDefinitionId,
} from "../core";
import { GUARD_ID } from "./guard";
import { PARRY_ID } from "./parry";

export const FEINT_ID = "feint" as CardDefinitionId;

export const Feint: CardDefinition = {
  id: FEINT_ID,
  cooldown: 2,
  abilities: [
    {
      trigger: AbilityTrigger.OnUse,
      targeting: { type: TargetingType.Self },
      effects: [
        {
          type: EffectType.ApplyStatus,
          statusType: StatusType.FeintActive,
          duration: 1,
          amount: 0,
        },
      ],
    },
    {
      trigger: AbilityTrigger.OnOpponentCardUse,
      targeting: { type: TargetingType.SingleEnemy },
      requirements: [
        {
          type: RequirementType.CardUsed,
          cardDefinitionIds: [GUARD_ID, PARRY_ID],
        },
        {
          type: RequirementType.Status,
          statusType: StatusType.FeintActive,
          subject: RequirementSubject.Actor,
        },
      ],
      effects: [
        {
          type: EffectType.ApplyStatus,
          statusType: StatusType.Opening,
          duration: 2,
          amount: 0,
          restrictedCardIds: [GUARD_ID, PARRY_ID],
        },
      ],
    },
  ],
};
