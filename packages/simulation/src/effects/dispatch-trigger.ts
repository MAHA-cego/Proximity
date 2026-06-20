import { type AbilityTrigger, type CardAbility } from "../core";
import type { ExecutionContext } from "../engine";

import { resolveEffects } from "./resolve-effects";

export function dispatchTrigger(
  context: ExecutionContext,
  trigger: AbilityTrigger,
  abilities: readonly CardAbility[],
): ExecutionContext {
  for (const ability of abilities) {
    if (ability.trigger === trigger) {
      resolveEffects(context, ability);
    }
  }

  return context;
}
