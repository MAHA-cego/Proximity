import {
  EffectType,
  ModifierType,
  StatusType,
  TargetingType,
  type CardAbility,
  type CardEffect,
  type CombatantId,
  type RuntimeModifier,
  type RuntimeStatus,
} from "../core";
import type { ExecutionContext } from "../engine";
import { checkRequirement } from "./check-requirement";

export function resolveEffects(
  context: ExecutionContext,
  ability: CardAbility,
  actorId?: CombatantId,
): ExecutionContext {
  const resolvedActorId = actorId ?? context.action.actorId;

  let targetIndices: number[] = [];
  let cardTargetCombatantIndex = -1;
  let cardTargetCardIndex = -1;

  if (ability.targeting.type === TargetingType.SingleEnemy) {
    const idx = context.state.combatants.findIndex(
      (cs) => cs.combatant.id !== resolvedActorId,
    );
    if (idx !== -1) targetIndices = [idx];
  } else if (ability.targeting.type === TargetingType.Self) {
    const idx = context.state.combatants.findIndex(
      (cs) => cs.combatant.id === resolvedActorId,
    );
    if (idx !== -1) targetIndices = [idx];
  } else if (ability.targeting.type === TargetingType.AllEnemies) {
    targetIndices = context.state.combatants.reduce<number[]>(
      (acc, cs, i) => (cs.combatant.id !== resolvedActorId ? [...acc, i] : acc),
      [],
    );
  } else if (ability.targeting.type === TargetingType.Card) {
    const targeting = ability.targeting;
    cardTargetCombatantIndex = context.state.combatants.findIndex(
      (cs) => cs.combatant.id === resolvedActorId,
    );
    if (cardTargetCombatantIndex !== -1) {
      cardTargetCardIndex = context.state.combatants[
        cardTargetCombatantIndex
      ].cards.findIndex((c) => c.definitionId === targeting.cardDefinitionId);
    }
  }

  for (const effect of ability.effects) {
    dispatchEffect(
      context,
      effect,
      resolvedActorId,
      targetIndices,
      cardTargetCombatantIndex,
      cardTargetCardIndex,
    );
  }

  return context;
}

function dispatchEffect(
  context: ExecutionContext,
  effect: CardEffect,
  actorId: CombatantId,
  targetIndices: number[],
  cardTargetCombatantIndex: number,
  cardTargetCardIndex: number,
): void {
  switch (effect.type) {
    case EffectType.Group: {
      for (const sub of effect.effects) {
        dispatchEffect(
          context,
          sub,
          actorId,
          targetIndices,
          cardTargetCombatantIndex,
          cardTargetCardIndex,
        );
      }
      break;
    }

    case EffectType.Conditional: {
      if (!checkRequirement(context.state, effect.condition, actorId)) break;
      for (const sub of effect.effects) {
        dispatchEffect(
          context,
          sub,
          actorId,
          targetIndices,
          cardTargetCombatantIndex,
          cardTargetCardIndex,
        );
      }
      break;
    }

    case EffectType.Damage: {
      const actorIdx = context.state.combatants.findIndex(
        (cs) => cs.combatant.id === actorId,
      );
      const actorState = context.state.combatants[actorIdx];
      const damageModifiers = actorState.modifiers.filter(
        (m) => m.type === ModifierType.Damage,
      );
      const modifierBonus = damageModifiers.reduce(
        (sum, m) => sum + m.amount,
        0,
      );

      if (damageModifiers.length > 0) {
        const consumedModifiers = actorState.modifiers
          .map(
            (m): RuntimeModifier =>
              m.type === ModifierType.Damage
                ? { ...m, remainingUses: m.remainingUses - 1 }
                : m,
          )
          .filter((m) => m.remainingUses > 0);
        const updatedActor = { ...actorState, modifiers: consumedModifiers };
        const updatedCombatants = [
          ...context.state.combatants.slice(0, actorIdx),
          updatedActor,
          ...context.state.combatants.slice(actorIdx + 1),
        ];
        context.replaceState({
          ...context.state,
          combatants: updatedCombatants,
        });
      }

      const totalDamage = effect.amount + modifierBonus;

      for (const targetIndex of targetIndices) {
        const { state } = context;
        const target = state.combatants[targetIndex];
        const shieldStatus = target.statuses.find(
          (s) => s.type === StatusType.Shield,
        );
        const shieldReduction = shieldStatus ? shieldStatus.amount : 0;
        const actualDamage = Math.max(0, totalDamage - shieldReduction);
        const updatedCombatant = {
          ...target,
          health: target.health - actualDamage,
        };
        const updatedCombatants = [
          ...state.combatants.slice(0, targetIndex),
          updatedCombatant,
          ...state.combatants.slice(targetIndex + 1),
        ];
        context.replaceState({ ...state, combatants: updatedCombatants });
      }
      break;
    }

    case EffectType.Heal: {
      const actorIdx = context.state.combatants.findIndex(
        (cs) => cs.combatant.id === actorId,
      );
      const actorState = context.state.combatants[actorIdx];
      const healModifiers = actorState.modifiers.filter(
        (m) => m.type === ModifierType.Heal,
      );
      const modifierBonus = healModifiers.reduce((sum, m) => sum + m.amount, 0);

      if (healModifiers.length > 0) {
        const consumedModifiers = actorState.modifiers
          .map(
            (m): RuntimeModifier =>
              m.type === ModifierType.Heal
                ? { ...m, remainingUses: m.remainingUses - 1 }
                : m,
          )
          .filter((m) => m.remainingUses > 0);
        const updatedActor = { ...actorState, modifiers: consumedModifiers };
        const updatedCombatants = [
          ...context.state.combatants.slice(0, actorIdx),
          updatedActor,
          ...context.state.combatants.slice(actorIdx + 1),
        ];
        context.replaceState({
          ...context.state,
          combatants: updatedCombatants,
        });
      }

      const totalHeal = effect.amount + modifierBonus;

      for (const targetIndex of targetIndices) {
        const { state } = context;
        const target = state.combatants[targetIndex];
        const matchCombatant = context.definition.combatants.find(
          (mc) => mc.combatant.id === target.combatant.id,
        );
        const maxHealth = matchCombatant!.combatant.maxHealth;
        const updatedCombatant = {
          ...target,
          health: Math.min(target.health + totalHeal, maxHealth),
        };
        const updatedCombatants = [
          ...state.combatants.slice(0, targetIndex),
          updatedCombatant,
          ...state.combatants.slice(targetIndex + 1),
        ];
        context.replaceState({ ...state, combatants: updatedCombatants });
      }
      break;
    }

    case EffectType.ReduceCooldown: {
      if (cardTargetCombatantIndex === -1 || cardTargetCardIndex === -1) break;

      const { state } = context;
      const combatant = state.combatants[cardTargetCombatantIndex];
      const card = combatant.cards[cardTargetCardIndex];
      const updatedCard = {
        ...card,
        remainingCooldown: Math.max(0, card.remainingCooldown - effect.amount),
      };
      const updatedCards = [
        ...combatant.cards.slice(0, cardTargetCardIndex),
        updatedCard,
        ...combatant.cards.slice(cardTargetCardIndex + 1),
      ];
      const updatedCombatant = { ...combatant, cards: updatedCards };
      const updatedCombatants = [
        ...state.combatants.slice(0, cardTargetCombatantIndex),
        updatedCombatant,
        ...state.combatants.slice(cardTargetCombatantIndex + 1),
      ];
      context.replaceState({ ...state, combatants: updatedCombatants });
      break;
    }

    case EffectType.RefreshCooldown: {
      if (cardTargetCombatantIndex === -1 || cardTargetCardIndex === -1) break;

      const { state } = context;
      const combatant = state.combatants[cardTargetCombatantIndex];
      const card = combatant.cards[cardTargetCardIndex];
      const updatedCard = { ...card, remainingCooldown: 0 };
      const updatedCards = [
        ...combatant.cards.slice(0, cardTargetCardIndex),
        updatedCard,
        ...combatant.cards.slice(cardTargetCardIndex + 1),
      ];
      const updatedCombatant = { ...combatant, cards: updatedCards };
      const updatedCombatants = [
        ...state.combatants.slice(0, cardTargetCombatantIndex),
        updatedCombatant,
        ...state.combatants.slice(cardTargetCombatantIndex + 1),
      ];
      context.replaceState({ ...state, combatants: updatedCombatants });
      break;
    }

    case EffectType.ExtendCooldown: {
      if (cardTargetCombatantIndex === -1 || cardTargetCardIndex === -1) break;

      const { state } = context;
      const combatant = state.combatants[cardTargetCombatantIndex];
      const card = combatant.cards[cardTargetCardIndex];
      const updatedCard = {
        ...card,
        remainingCooldown: card.remainingCooldown + effect.amount,
      };
      const updatedCards = [
        ...combatant.cards.slice(0, cardTargetCardIndex),
        updatedCard,
        ...combatant.cards.slice(cardTargetCardIndex + 1),
      ];
      const updatedCombatant = { ...combatant, cards: updatedCards };
      const updatedCombatants = [
        ...state.combatants.slice(0, cardTargetCombatantIndex),
        updatedCombatant,
        ...state.combatants.slice(cardTargetCombatantIndex + 1),
      ];
      context.replaceState({ ...state, combatants: updatedCombatants });
      break;
    }

    case EffectType.ApplyModifier: {
      for (const targetIndex of targetIndices) {
        const { state } = context;
        const target = state.combatants[targetIndex];
        const newModifier: RuntimeModifier = {
          type: effect.modifierType,
          amount: effect.amount,
          remainingUses: effect.uses,
        };
        const updatedCombatant = {
          ...target,
          modifiers: [...target.modifiers, newModifier],
        };
        const updatedCombatants = [
          ...state.combatants.slice(0, targetIndex),
          updatedCombatant,
          ...state.combatants.slice(targetIndex + 1),
        ];
        context.replaceState({ ...state, combatants: updatedCombatants });
      }
      break;
    }

    case EffectType.ApplyStatus: {
      for (const targetIndex of targetIndices) {
        const { state } = context;
        const target = state.combatants[targetIndex];
        const newStatus: RuntimeStatus = {
          type: effect.statusType,
          remainingDuration: effect.duration,
          amount: effect.amount,
        };
        const updatedCombatant = {
          ...target,
          statuses: [...target.statuses, newStatus],
        };
        const updatedCombatants = [
          ...state.combatants.slice(0, targetIndex),
          updatedCombatant,
          ...state.combatants.slice(targetIndex + 1),
        ];
        context.replaceState({ ...state, combatants: updatedCombatants });
      }
      break;
    }
  }
}
