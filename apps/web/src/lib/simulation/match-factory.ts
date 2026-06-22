import {
  BATTLE_CRY_ID,
  BattleCry,
  CombatantControlType,
  GUARD_ID,
  Guard,
  HEAVY_STRIKE_ID,
  HeavyStrike,
  LACERATION_ID,
  Laceration,
  RECOVER_ID,
  Recover,
  SLASH_ID,
  Slash,
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

const STARTER_CARD_DEFINITIONS = new Map([
  [SLASH_ID, Slash],
  [GUARD_ID, Guard],
  [RECOVER_ID, Recover],
  [HEAVY_STRIKE_ID, HeavyStrike],
  [BATTLE_CRY_ID, BattleCry],
  [LACERATION_ID, Laceration],
]);

const STARTER_LOADOUT = {
  cardDefinitionIds: [
    SLASH_ID,
    GUARD_ID,
    RECOVER_ID,
    HEAVY_STRIKE_ID,
    BATTLE_CRY_ID,
    LACERATION_ID,
  ],
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
