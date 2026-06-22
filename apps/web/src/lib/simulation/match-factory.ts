import {
  CombatantControlType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CombatantDefinition,
  type CombatantId,
  type CombatantLoadout,
  type MatchDefinition,
} from "@proximity/simulation";
import type { EncounterDefinition } from "./encounters";

export const PLAYER_COMBATANT_ID = "player" as CombatantId;

const PLAYER: CombatantDefinition = {
  id: PLAYER_COMBATANT_ID,
  team: Team.One,
  maxHealth: 100,
  controlType: CombatantControlType.Human,
};

export function createMatchDefinition(
  encounter: EncounterDefinition,
  playerLoadout: CombatantLoadout,
  playerCardDefinitions: ReadonlyMap<CardDefinitionId, CardDefinition>,
): MatchDefinition {
  const cardDefinitions = new Map([
    ...playerCardDefinitions,
    ...encounter.cardDefinitions,
  ]);

  return {
    combatants: [
      { combatant: PLAYER, loadout: playerLoadout },
      encounter.opponent,
    ],
    cardDefinitions,
  };
}
