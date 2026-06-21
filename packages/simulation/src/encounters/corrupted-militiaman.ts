import {
  EXPLOIT_ID,
  Exploit,
  FEINT_ID,
  Feint,
  GUARD_ID,
  Guard,
  PARRY_ID,
  Parry,
  RECOVER_ID,
  Recover,
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

export const CORRUPTED_MILITIAMAN_ID = "corrupted-militiaman" as CombatantId;

export const CorruptedMilitiaman: CombatantDefinition = {
  id: CORRUPTED_MILITIAMAN_ID,
  team: Team.Two,
  maxHealth: 110,
  controlType: CombatantControlType.AI,
};

export const CorruptedMilitiamanLoadout: CombatantLoadout = {
  cardDefinitionIds: [
    SLASH_ID,
    GUARD_ID,
    RECOVER_ID,
    PARRY_ID,
    FEINT_ID,
    EXPLOIT_ID,
  ],
};

export const CorruptedMilitiamanMatchCombatant: MatchCombatant = {
  combatant: CorruptedMilitiaman,
  loadout: CorruptedMilitiamanLoadout,
};

export const CORRUPTED_MILITIAMAN_CARD_DEFINITIONS: ReadonlyMap<
  CardDefinitionId,
  CardDefinition
> = new Map([
  [SLASH_ID, Slash],
  [GUARD_ID, Guard],
  [RECOVER_ID, Recover],
  [PARRY_ID, Parry],
  [FEINT_ID, Feint],
  [EXPLOIT_ID, Exploit],
]);

export const CORRUPTED_MILITIAMAN_UNLOCK_REWARDS: readonly CardDefinitionId[] =
  [FEINT_ID, EXPLOIT_ID];
