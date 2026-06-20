import {
  Comparison,
  RequirementSubject,
  RequirementType,
  type AbilityRequirement,
  type PlayerId,
} from "../core";
import type { GameState } from "../state";

export function checkRequirement(
  state: GameState,
  req: AbilityRequirement,
  actorId: PlayerId,
): boolean {
  switch (req.type) {
    case RequirementType.Health: {
      const resolvedId =
        req.subject === RequirementSubject.Enemy
          ? state.players.find((ps) => ps.player.id !== actorId)?.player.id
          : actorId;
      const subjectState = state.players.find(
        (ps) => ps.player.id === resolvedId,
      );
      if (!subjectState) return false;
      if (req.comparison === Comparison.Below)
        return subjectState.health < req.threshold;
      return subjectState.health > req.threshold;
    }
  }
}
