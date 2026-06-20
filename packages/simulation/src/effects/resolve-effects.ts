import {
  EffectType,
  ModifierType,
  StatusType,
  TargetingType,
  type CardAbility,
  type CardEffect,
  type PlayerId,
  type RuntimeModifier,
  type RuntimeStatus,
} from "../core";
import type { ExecutionContext } from "../engine";
import { checkRequirement } from "./check-requirement";

export function resolveEffects(
  context: ExecutionContext,
  ability: CardAbility,
  actorId?: PlayerId,
): ExecutionContext {
  const resolvedActorId = actorId ?? context.action.actorId;

  let targetIndices: number[] = [];
  let cardTargetPlayerIndex = -1;
  let cardTargetCardIndex = -1;

  if (ability.targeting.type === TargetingType.SingleEnemy) {
    const idx = context.state.players.findIndex(
      (ps) => ps.player.id !== resolvedActorId,
    );
    if (idx !== -1) targetIndices = [idx];
  } else if (ability.targeting.type === TargetingType.Self) {
    const idx = context.state.players.findIndex(
      (ps) => ps.player.id === resolvedActorId,
    );
    if (idx !== -1) targetIndices = [idx];
  } else if (ability.targeting.type === TargetingType.AllEnemies) {
    targetIndices = context.state.players.reduce<number[]>(
      (acc, ps, i) => (ps.player.id !== resolvedActorId ? [...acc, i] : acc),
      [],
    );
  } else if (ability.targeting.type === TargetingType.Card) {
    const targeting = ability.targeting;
    cardTargetPlayerIndex = context.state.players.findIndex(
      (ps) => ps.player.id === resolvedActorId,
    );
    if (cardTargetPlayerIndex !== -1) {
      cardTargetCardIndex = context.state.players[
        cardTargetPlayerIndex
      ].cards.findIndex((c) => c.definitionId === targeting.cardDefinitionId);
    }
  }

  for (const effect of ability.effects) {
    dispatchEffect(
      context,
      effect,
      resolvedActorId,
      targetIndices,
      cardTargetPlayerIndex,
      cardTargetCardIndex,
    );
  }

  return context;
}

function dispatchEffect(
  context: ExecutionContext,
  effect: CardEffect,
  actorId: PlayerId,
  targetIndices: number[],
  cardTargetPlayerIndex: number,
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
          cardTargetPlayerIndex,
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
          cardTargetPlayerIndex,
          cardTargetCardIndex,
        );
      }
      break;
    }

    case EffectType.Damage: {
      const actorIdx = context.state.players.findIndex(
        (ps) => ps.player.id === actorId,
      );
      const actorState = context.state.players[actorIdx];
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
        const updatedPlayers = [
          ...context.state.players.slice(0, actorIdx),
          updatedActor,
          ...context.state.players.slice(actorIdx + 1),
        ];
        context.replaceState({ ...context.state, players: updatedPlayers });
      }

      const totalDamage = effect.amount + modifierBonus;

      for (const targetIndex of targetIndices) {
        const { state } = context;
        const target = state.players[targetIndex];
        const shieldStatus = target.statuses.find(
          (s) => s.type === StatusType.Shield,
        );
        const shieldReduction = shieldStatus ? shieldStatus.amount : 0;
        const actualDamage = Math.max(0, totalDamage - shieldReduction);
        const updatedPlayer = {
          ...target,
          health: target.health - actualDamage,
        };
        const updatedPlayers = [
          ...state.players.slice(0, targetIndex),
          updatedPlayer,
          ...state.players.slice(targetIndex + 1),
        ];
        context.replaceState({ ...state, players: updatedPlayers });
      }
      break;
    }

    case EffectType.Heal: {
      const actorIdx = context.state.players.findIndex(
        (ps) => ps.player.id === actorId,
      );
      const actorState = context.state.players[actorIdx];
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
        const updatedPlayers = [
          ...context.state.players.slice(0, actorIdx),
          updatedActor,
          ...context.state.players.slice(actorIdx + 1),
        ];
        context.replaceState({ ...context.state, players: updatedPlayers });
      }

      const totalHeal = effect.amount + modifierBonus;

      for (const targetIndex of targetIndices) {
        const { state } = context;
        const target = state.players[targetIndex];
        const matchPlayer = context.definition.players.find(
          (mp) => mp.player.id === target.player.id,
        );
        const maxHealth = matchPlayer!.player.maxHealth;
        const updatedPlayer = {
          ...target,
          health: Math.min(target.health + totalHeal, maxHealth),
        };
        const updatedPlayers = [
          ...state.players.slice(0, targetIndex),
          updatedPlayer,
          ...state.players.slice(targetIndex + 1),
        ];
        context.replaceState({ ...state, players: updatedPlayers });
      }
      break;
    }

    case EffectType.ReduceCooldown: {
      if (cardTargetPlayerIndex === -1 || cardTargetCardIndex === -1) break;

      const { state } = context;
      const player = state.players[cardTargetPlayerIndex];
      const card = player.cards[cardTargetCardIndex];
      const updatedCard = {
        ...card,
        remainingCooldown: Math.max(0, card.remainingCooldown - effect.amount),
      };
      const updatedCards = [
        ...player.cards.slice(0, cardTargetCardIndex),
        updatedCard,
        ...player.cards.slice(cardTargetCardIndex + 1),
      ];
      const updatedPlayer = { ...player, cards: updatedCards };
      const updatedPlayers = [
        ...state.players.slice(0, cardTargetPlayerIndex),
        updatedPlayer,
        ...state.players.slice(cardTargetPlayerIndex + 1),
      ];
      context.replaceState({ ...state, players: updatedPlayers });
      break;
    }

    case EffectType.RefreshCooldown: {
      if (cardTargetPlayerIndex === -1 || cardTargetCardIndex === -1) break;

      const { state } = context;
      const player = state.players[cardTargetPlayerIndex];
      const card = player.cards[cardTargetCardIndex];
      const updatedCard = { ...card, remainingCooldown: 0 };
      const updatedCards = [
        ...player.cards.slice(0, cardTargetCardIndex),
        updatedCard,
        ...player.cards.slice(cardTargetCardIndex + 1),
      ];
      const updatedPlayer = { ...player, cards: updatedCards };
      const updatedPlayers = [
        ...state.players.slice(0, cardTargetPlayerIndex),
        updatedPlayer,
        ...state.players.slice(cardTargetPlayerIndex + 1),
      ];
      context.replaceState({ ...state, players: updatedPlayers });
      break;
    }

    case EffectType.ExtendCooldown: {
      if (cardTargetPlayerIndex === -1 || cardTargetCardIndex === -1) break;

      const { state } = context;
      const player = state.players[cardTargetPlayerIndex];
      const card = player.cards[cardTargetCardIndex];
      const updatedCard = {
        ...card,
        remainingCooldown: card.remainingCooldown + effect.amount,
      };
      const updatedCards = [
        ...player.cards.slice(0, cardTargetCardIndex),
        updatedCard,
        ...player.cards.slice(cardTargetCardIndex + 1),
      ];
      const updatedPlayer = { ...player, cards: updatedCards };
      const updatedPlayers = [
        ...state.players.slice(0, cardTargetPlayerIndex),
        updatedPlayer,
        ...state.players.slice(cardTargetPlayerIndex + 1),
      ];
      context.replaceState({ ...state, players: updatedPlayers });
      break;
    }

    case EffectType.ApplyModifier: {
      for (const targetIndex of targetIndices) {
        const { state } = context;
        const target = state.players[targetIndex];
        const newModifier: RuntimeModifier = {
          type: effect.modifierType,
          amount: effect.amount,
          remainingUses: effect.uses,
        };
        const updatedPlayer = {
          ...target,
          modifiers: [...target.modifiers, newModifier],
        };
        const updatedPlayers = [
          ...state.players.slice(0, targetIndex),
          updatedPlayer,
          ...state.players.slice(targetIndex + 1),
        ];
        context.replaceState({ ...state, players: updatedPlayers });
      }
      break;
    }

    case EffectType.ApplyStatus: {
      for (const targetIndex of targetIndices) {
        const { state } = context;
        const target = state.players[targetIndex];
        const newStatus: RuntimeStatus = {
          type: effect.statusType,
          remainingDuration: effect.duration,
          amount: effect.amount,
        };
        const updatedPlayer = {
          ...target,
          statuses: [...target.statuses, newStatus],
        };
        const updatedPlayers = [
          ...state.players.slice(0, targetIndex),
          updatedPlayer,
          ...state.players.slice(targetIndex + 1),
        ];
        context.replaceState({ ...state, players: updatedPlayers });
      }
      break;
    }
  }
}
