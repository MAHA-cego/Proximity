import { BasicStrike, BASIC_STRIKE_ID } from "../cards";
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

export const GOBLIN_RAIDER_ID = "goblin-raider" as CombatantId;

export const GoblinRaider: CombatantDefinition = {
  id: GOBLIN_RAIDER_ID,
  team: Team.Two,
  maxHealth: 15,
  controlType: CombatantControlType.AI,
};

export const GoblinRaiderLoadout: CombatantLoadout = {
  cardDefinitionIds: [BASIC_STRIKE_ID],
};

export const GoblinRaiderMatchCombatant: MatchCombatant = {
  combatant: GoblinRaider,
  loadout: GoblinRaiderLoadout,
};

export const GOBLIN_RAIDER_CARD_DEFINITIONS: ReadonlyMap<
  CardDefinitionId,
  CardDefinition
> = new Map([[BASIC_STRIKE_ID, BasicStrike]]);
