import { BasicStrike, BASIC_STRIKE_ID } from "../cards";
import {
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type MatchPlayer,
  type Player,
  type PlayerLoadout,
  type PlayerId,
} from "../core";

export const GOBLIN_RAIDER_ID = "goblin-raider" as PlayerId;

export const GoblinRaider: Player = {
  id: GOBLIN_RAIDER_ID,
  team: Team.Two,
  maxHealth: 15,
};

export const GoblinRaiderLoadout: PlayerLoadout = {
  cardDefinitionIds: [BASIC_STRIKE_ID],
};

export const GoblinRaiderMatchPlayer: MatchPlayer = {
  player: GoblinRaider,
  loadout: GoblinRaiderLoadout,
};

export const GOBLIN_RAIDER_CARD_DEFINITIONS: ReadonlyMap<
  CardDefinitionId,
  CardDefinition
> = new Map([[BASIC_STRIKE_ID, BasicStrike]]);
