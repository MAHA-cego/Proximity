import type { CardInstanceId, PlayerId } from "../core";

import type { GameState, PlayerCardState } from "../state";

export function findPlayerCard(
  state: GameState,
  playerId: PlayerId,
  instanceId: CardInstanceId,
): PlayerCardState | undefined {
  const playerState = state.players.find((ps) => ps.player.id === playerId);

  if (playerState === undefined) {
    return undefined;
  }

  return playerState.cards.find((card) => card.instanceId === instanceId);
}
