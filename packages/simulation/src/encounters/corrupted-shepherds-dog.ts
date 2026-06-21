import {
  BATTLE_CRY_ID,
  BattleCry,
  BERSERK_ID,
  Berserk,
  HEAVY_STRIKE_ID,
  HeavyStrike,
  LACERATION_ID,
  Laceration,
  PARRY_ID,
  Parry,
  SLASH_ID,
  Slash,
} from "../cards";
import {
  CombatantControlType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CombatantDefinition,
  type CombatantId,
  type CombatantLoadout,
  type MatchCombatant,
} from "../core";

export const CORRUPTED_SHEPHERDS_DOG_ID =
  "corrupted-shepherds-dog" as CombatantId;

export const CorruptedShepherdsDog: CombatantDefinition = {
  id: CORRUPTED_SHEPHERDS_DOG_ID,
  team: Team.Two,
  maxHealth: 90,
  controlType: CombatantControlType.AI,
};

export const CorruptedShepherdsDogLoadout: CombatantLoadout = {
  cardDefinitionIds: [
    SLASH_ID,
    LACERATION_ID,
    HEAVY_STRIKE_ID,
    BATTLE_CRY_ID,
    PARRY_ID,
    BERSERK_ID,
  ],
};

export const CorruptedShepherdsDogMatchCombatant: MatchCombatant = {
  combatant: CorruptedShepherdsDog,
  loadout: CorruptedShepherdsDogLoadout,
};

export const CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS: ReadonlyMap<
  CardDefinitionId,
  CardDefinition
> = new Map([
  [SLASH_ID, Slash],
  [LACERATION_ID, Laceration],
  [HEAVY_STRIKE_ID, HeavyStrike],
  [BATTLE_CRY_ID, BattleCry],
  [PARRY_ID, Parry],
  [BERSERK_ID, Berserk],
]);

export const CORRUPTED_SHEPHERDS_DOG_UNLOCK_REWARDS: readonly CardDefinitionId[] =
  [PARRY_ID, BERSERK_ID];
