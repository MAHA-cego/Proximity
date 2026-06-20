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
    switch (effect.type) {
      case EffectType.Damage: {
        for (const targetIndex of targetIndices) {
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
        }
        break;
      }

      case EffectType.Heal: {
        for (const targetIndex of targetIndices) {
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
          remainingCooldown: Math.max(
            0,
            card.remainingCooldown - effect.amount,
          ),
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
    }
  }

  return context;
}
