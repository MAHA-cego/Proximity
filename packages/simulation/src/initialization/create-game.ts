import {
  type CardInstanceId,
  type MatchDefinition,
  type MatchId,
} from "../core";

import {
  MatchStatus,
  type CombatantCardState,
  type CombatantState,
  type GameState,
} from "../state";

export interface CreateGameOptions {
  readonly matchId: MatchId;

  readonly definition: MatchDefinition;
}

export function createGame(options: CreateGameOptions): GameState {
  if (options.definition.combatants.length < 2) {
    throw new Error("A game requires at least two combatants.");
  }

  const combatants: CombatantState[] = options.definition.combatants.map(
    ({ combatant, loadout }) => {
      const cards: CombatantCardState[] = loadout.cardDefinitionIds.map(
        (definitionId, index) => ({
          instanceId: `${combatant.id}:${index + 1}` as CardInstanceId,
          definitionId,
          remainingCooldown: 0,
        }),
      );

      return {
        combatant,
        health: combatant.maxHealth,
        cards,
        modifiers: [],
        statuses: [],
      };
    },
  );

  return {
    metadata: {
      id: options.matchId,
    },

    combatants,

    turn: {
      number: 1,
      activeCombatantId: combatants[0].combatant.id,
    },

    status: MatchStatus.InProgress,

    sequence: 0,
  };
}
