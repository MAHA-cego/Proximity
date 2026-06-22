import { ActionType } from "../actions";
import { AbilityTrigger, StatusType, TargetingType } from "../core";
import { resolveEffects } from "../effects";
import type { ExecutionContext } from "../engine/execution-context";
import { EventType } from "../events";

import type { GameSystem } from "./game-system";

export class StatusSystem implements GameSystem {
  public execute(context: ExecutionContext): void {
    if (context.action.type !== ActionType.EndTurn) return;

    const activeCombatantId = context.state.turn.activeCombatantId;
    const combatantIndex = context.state.combatants.findIndex(
      (cs) => cs.combatant.id === activeCombatantId,
    );
    const combatantState = context.state.combatants[combatantIndex];

    if (combatantState.statuses.length === 0) return;

    for (const status of combatantState.statuses) {
      switch (status.type) {
        case StatusType.Berserk:
          break;

        case StatusType.Bleeding: {
          const { state } = context;
          const target = state.combatants[combatantIndex];
          const updatedCombatants = [
            ...state.combatants.slice(0, combatantIndex),
            { ...target, health: target.health - status.amount },
            ...state.combatants.slice(combatantIndex + 1),
          ];
          context.replaceState({ ...state, combatants: updatedCombatants });
          context.emit({
            type: EventType.DamageDealt,
            sourceId: activeCombatantId,
            targetId: activeCombatantId,
            amount: status.amount,
          });
          break;
        }

        case StatusType.Burn: {
          const { state } = context;
          const target = state.combatants[combatantIndex];
          const updatedCombatants = [
            ...state.combatants.slice(0, combatantIndex),
            { ...target, health: target.health - status.amount },
            ...state.combatants.slice(combatantIndex + 1),
          ];
          context.replaceState({ ...state, combatants: updatedCombatants });
          context.emit({
            type: EventType.DamageDealt,
            sourceId: activeCombatantId,
            targetId: activeCombatantId,
            amount: status.amount,
          });
          break;
        }

        case StatusType.Exhausted:
          break;

        case StatusType.FeintActive:
          break;

        case StatusType.Opening:
          break;

        case StatusType.Parry:
          break;

        case StatusType.Regeneration: {
          const { state } = context;
          const target = state.combatants[combatantIndex];
          const matchCombatant = context.definition.combatants.find(
            (mc) => mc.combatant.id === activeCombatantId,
          )!;
          const maxHealth = matchCombatant.combatant.maxHealth;
          const effectiveHeal = Math.min(
            status.amount,
            maxHealth - target.health,
          );
          const updatedCombatants = [
            ...state.combatants.slice(0, combatantIndex),
            {
              ...target,
              health: Math.min(target.health + status.amount, maxHealth),
            },
            ...state.combatants.slice(combatantIndex + 1),
          ];
          context.replaceState({ ...state, combatants: updatedCombatants });
          if (effectiveHeal > 0) {
            context.emit({
              type: EventType.HealingDone,
              sourceId: activeCombatantId,
              targetId: activeCombatantId,
              amount: effectiveHeal,
            });
          }
          break;
        }

        case StatusType.Shield:
          break;
      }
    }

    // Collect onExpiry effects from statuses about to expire before removing them.
    // Must fire AFTER decrement so the newly applied statuses aren't immediately swept.
    const { state: stateAfterEffects } = context;
    const combatantAfterEffects = stateAfterEffects.combatants[combatantIndex];
    const expiryEffects = combatantAfterEffects.statuses
      .filter((s) => s.remainingDuration === 1 && s.onExpiry?.length)
      .flatMap((s) => s.onExpiry!);

    const { state } = context;
    const latestCombatant = state.combatants[combatantIndex];

    for (const status of latestCombatant.statuses) {
      if (status.remainingDuration === 1) {
        context.emit({
          type: EventType.StatusRemoved,
          targetId: activeCombatantId,
          statusType: status.type,
        });
      }
    }

    const updatedStatuses = latestCombatant.statuses
      .map((s) => ({ ...s, remainingDuration: s.remainingDuration - 1 }))
      .filter((s) => s.remainingDuration > 0);
    const updatedCombatants = [
      ...state.combatants.slice(0, combatantIndex),
      { ...latestCombatant, statuses: updatedStatuses },
      ...state.combatants.slice(combatantIndex + 1),
    ];
    context.replaceState({ ...state, combatants: updatedCombatants });

    if (expiryEffects.length > 0) {
      resolveEffects(
        context,
        {
          trigger: AbilityTrigger.Passive,
          targeting: { type: TargetingType.Self },
          effects: expiryEffects,
        },
        activeCombatantId,
      );
    }
  }
}
