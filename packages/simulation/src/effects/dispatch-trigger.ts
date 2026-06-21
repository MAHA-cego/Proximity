import {
  type AbilityTrigger,
  type CardAbility,
  type CombatantId,
} from "../core";
import type { ExecutionContext } from "../engine";

import { resolveEffects } from "./resolve-effects";

export function dispatchTrigger(
  context: ExecutionContext,
  trigger: AbilityTrigger,
  abilities: readonly CardAbility[],
  actorId?: CombatantId,
): ExecutionContext {
  for (const ability of abilities) {
    if (ability.trigger === trigger) {
      resolveEffects(context, ability, actorId);
    }
  }

  return context;
}
