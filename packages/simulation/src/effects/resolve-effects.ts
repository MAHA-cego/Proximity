import {
  EffectType,
  TargetingType,
  type CardAbility,
  type PlayerId,
} from "../core";
import type { ExecutionContext } from "../engine";

export function resolveEffects(
  context: ExecutionContext,
  ability: CardAbility,
  actorId?: PlayerId,
): ExecutionContext {
  const resolvedActorId = actorId ?? context.action.actorId;

  let targetIndex = -1;

  if (ability.targeting.type === TargetingType.SingleEnemy) {
    targetIndex = context.state.players.findIndex(
      (ps) => ps.player.id !== resolvedActorId,
    );
  } else if (ability.targeting.type === TargetingType.Self) {
    targetIndex = context.state.players.findIndex(
      (ps) => ps.player.id === resolvedActorId,
    );
  }

  for (const effect of ability.effects) {
    switch (effect.type) {
      case EffectType.Damage: {
        if (targetIndex === -1) break;

        const { state } = context;
        const target = state.players[targetIndex];

        const updatedPlayer = {
          ...target,
          health: target.health - effect.amount,
        };

        const updatedPlayers = [
          ...state.players.slice(0, targetIndex),
          updatedPlayer,
          ...state.players.slice(targetIndex + 1),
        ];

        context.replaceState({ ...state, players: updatedPlayers });
        break;
      }

      case EffectType.Heal: {
        if (targetIndex === -1) break;

        const { state } = context;
        const target = state.players[targetIndex];

        const matchPlayer = context.definition.players.find(
          (mp) => mp.player.id === target.player.id,
        );

        const maxHealth = matchPlayer!.player.maxHealth;

        const updatedPlayer = {
          ...target,
          health: Math.min(target.health + effect.amount, maxHealth),
        };

        const updatedPlayers = [
          ...state.players.slice(0, targetIndex),
          updatedPlayer,
          ...state.players.slice(targetIndex + 1),
        ];

        context.replaceState({ ...state, players: updatedPlayers });
        break;
      }

      case EffectType.ReduceCooldown: {
        if (targetIndex === -1) break;

        const { state } = context;
        const target = state.players[targetIndex];
        const cardIndex = target.cards.findIndex(
          (c) => c.definitionId === effect.cardDefinitionId,
        );

        if (cardIndex === -1) break;

        const card = target.cards[cardIndex];
        const updatedCard = {
          ...card,
          remainingCooldown: Math.max(
            0,
            card.remainingCooldown - effect.amount,
          ),
        };
        const updatedCards = [
          ...target.cards.slice(0, cardIndex),
          updatedCard,
          ...target.cards.slice(cardIndex + 1),
        ];
        const updatedPlayer = { ...target, cards: updatedCards };
        const updatedPlayers = [
          ...state.players.slice(0, targetIndex),
          updatedPlayer,
          ...state.players.slice(targetIndex + 1),
        ];

        context.replaceState({ ...state, players: updatedPlayers });
        break;
      }

      case EffectType.RefreshCooldown: {
        if (targetIndex === -1) break;

        const { state } = context;
        const target = state.players[targetIndex];
        const cardIndex = target.cards.findIndex(
          (c) => c.definitionId === effect.cardDefinitionId,
        );

        if (cardIndex === -1) break;

        const card = target.cards[cardIndex];
        const updatedCard = { ...card, remainingCooldown: 0 };
        const updatedCards = [
          ...target.cards.slice(0, cardIndex),
          updatedCard,
          ...target.cards.slice(cardIndex + 1),
        ];
        const updatedPlayer = { ...target, cards: updatedCards };
        const updatedPlayers = [
          ...state.players.slice(0, targetIndex),
          updatedPlayer,
          ...state.players.slice(targetIndex + 1),
        ];

        context.replaceState({ ...state, players: updatedPlayers });
        break;
      }
    }
  }

  return context;
}
