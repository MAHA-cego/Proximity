import type { CardInstanceId, CombatantId } from "../core";

import type { CombatantCardState, GameState } from "../state";

export function findCombatantCard(
  state: GameState,
  combatantId: CombatantId,
  instanceId: CardInstanceId,
): CombatantCardState | undefined {
  const combatantState = state.combatants.find(
    (cs) => cs.combatant.id === combatantId,
  );

  if (combatantState === undefined) {
    return undefined;
  }

  return combatantState.cards.find((card) => card.instanceId === instanceId);
}
