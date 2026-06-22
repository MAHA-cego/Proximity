import {
  CombatantControlType,
  STARTER_CARD_DEFINITIONS,
  STARTER_LOADOUT,
  Team,
  type CombatantDefinition,
  type CombatantId,
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
): MatchDefinition {
  const cardDefinitions = new Map([
    ...STARTER_CARD_DEFINITIONS,
    ...encounter.cardDefinitions,
  ]);

  return {
    combatants: [
      { combatant: PLAYER, loadout: STARTER_LOADOUT },
      encounter.opponent,
    ],
    cardDefinitions,
  };
}
