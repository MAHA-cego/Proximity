import {
  Comparison,
  RequirementSubject,
  RequirementType,
  type AbilityRequirement,
  type CardDefinitionId,
  type CombatantId,
} from "../core";
import type { GameState } from "../state";

export function checkRequirement(
  state: GameState,
  req: AbilityRequirement,
  actorId: CombatantId,
  triggeredByCardId?: CardDefinitionId,
): boolean {
  switch (req.type) {
    case RequirementType.Health: {
      const resolvedId =
        req.subject === RequirementSubject.Enemy
          ? state.combatants.find((cs) => cs.combatant.id !== actorId)
              ?.combatant.id
          : actorId;
      const subjectState = state.combatants.find(
        (cs) => cs.combatant.id === resolvedId,
      );
      if (!subjectState) return false;
      switch (req.comparison) {
        case Comparison.Below:
          return subjectState.health < req.threshold;
        case Comparison.BelowOrEqual:
          return subjectState.health <= req.threshold;
        case Comparison.Above:
          return subjectState.health > req.threshold;
      }
    }

    case RequirementType.CardUsed: {
      if (!triggeredByCardId) return false;
      return req.cardDefinitionIds.includes(triggeredByCardId);
    }

    case RequirementType.Status: {
      const resolvedId =
        req.subject === RequirementSubject.Enemy
          ? state.combatants.find((cs) => cs.combatant.id !== actorId)
              ?.combatant.id
          : actorId;
      const subjectState = state.combatants.find(
        (cs) => cs.combatant.id === resolvedId,
      );
      if (!subjectState) return false;
      return subjectState.statuses.some((s) => s.type === req.statusType);
    }
  }
}
