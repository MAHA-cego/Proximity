import { ActionType } from "../actions";
import { StatusType } from "../core";
import type { ExecutionContext } from "../engine/execution-context";

import type { GameSystem } from "./game-system";

export class StatusSystem implements GameSystem {
  public execute(context: ExecutionContext): void {
    if (context.action.type !== ActionType.EndTurn) return;

    const activePlayerId = context.state.turn.activePlayerId;
    const playerIndex = context.state.players.findIndex(
      (ps) => ps.player.id === activePlayerId,
    );
    const playerState = context.state.players[playerIndex];

    if (playerState.statuses.length === 0) return;

    for (const status of playerState.statuses) {
      switch (status.type) {
        case StatusType.Burn: {
          const { state } = context;
          const target = state.players[playerIndex];
          const updatedPlayers = [
            ...state.players.slice(0, playerIndex),
            { ...target, health: target.health - status.amount },
            ...state.players.slice(playerIndex + 1),
          ];
          context.replaceState({ ...state, players: updatedPlayers });
          break;
        }

        case StatusType.Regeneration: {
          const { state } = context;
          const target = state.players[playerIndex];
          const matchPlayer = context.definition.players.find(
            (mp) => mp.player.id === activePlayerId,
          )!;
          const maxHealth = matchPlayer.player.maxHealth;
          const updatedPlayers = [
            ...state.players.slice(0, playerIndex),
            {
              ...target,
              health: Math.min(target.health + status.amount, maxHealth),
            },
            ...state.players.slice(playerIndex + 1),
          ];
          context.replaceState({ ...state, players: updatedPlayers });
          break;
        }

        case StatusType.Shield:
          break;
      }
    }

    const { state } = context;
    const latestPlayer = state.players[playerIndex];
    const updatedStatuses = latestPlayer.statuses
      .map((s) => ({ ...s, remainingDuration: s.remainingDuration - 1 }))
      .filter((s) => s.remainingDuration > 0);
    const updatedPlayers = [
      ...state.players.slice(0, playerIndex),
      { ...latestPlayer, statuses: updatedStatuses },
      ...state.players.slice(playerIndex + 1),
    ];
    context.replaceState({ ...state, players: updatedPlayers });
  }
}
