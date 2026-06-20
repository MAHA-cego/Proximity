import { EffectType, TargetingType, type CardAbility } from "../core";
import type { ExecutionContext } from "../engine";

export function resolveEffects(
  context: ExecutionContext,
  ability: CardAbility,
): ExecutionContext {
  const actorId = context.action.actorId;

  let targetIndex = -1;

  if (ability.targeting.type === TargetingType.SingleEnemy) {
    targetIndex = context.state.players.findIndex(
      (ps) => ps.player.id !== actorId,
    );
  } else if (ability.targeting.type === TargetingType.Self) {
    targetIndex = context.state.players.findIndex(
      (ps) => ps.player.id === actorId,
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
    }
  }

  return context;
}
