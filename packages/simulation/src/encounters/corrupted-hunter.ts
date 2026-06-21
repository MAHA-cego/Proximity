import {
  GUARD_ID,
  Guard,
  HEAVY_STRIKE_ID,
  HeavyStrike,
  PREPARATION_ID,
  Preparation,
  RECOVER_ID,
  Recover,
  REGENERATION_ID,
  Regeneration,
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

export const CORRUPTED_HUNTER_ID = "corrupted-hunter" as CombatantId;

export const CorruptedHunter: CombatantDefinition = {
  id: CORRUPTED_HUNTER_ID,
  team: Team.Two,
  maxHealth: 100,
  controlType: CombatantControlType.AI,
};

export const CorruptedHunterLoadout: CombatantLoadout = {
  cardDefinitionIds: [
    SLASH_ID,
    GUARD_ID,
    HEAVY_STRIKE_ID,
    RECOVER_ID,
    PREPARATION_ID,
    REGENERATION_ID,
  ],
};

export const CorruptedHunterMatchCombatant: MatchCombatant = {
  combatant: CorruptedHunter,
  loadout: CorruptedHunterLoadout,
};

export const CORRUPTED_HUNTER_CARD_DEFINITIONS: ReadonlyMap<
  CardDefinitionId,
  CardDefinition
> = new Map([
  [SLASH_ID, Slash],
  [GUARD_ID, Guard],
  [HEAVY_STRIKE_ID, HeavyStrike],
  [RECOVER_ID, Recover],
  [PREPARATION_ID, Preparation],
  [REGENERATION_ID, Regeneration],
]);

export const CORRUPTED_HUNTER_UNLOCK_REWARDS: readonly CardDefinitionId[] = [
  PREPARATION_ID,
  REGENERATION_ID,
];
