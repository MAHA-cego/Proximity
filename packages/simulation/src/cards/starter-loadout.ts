import type {
  CardDefinition,
  CardDefinitionId,
  CombatantLoadout,
} from "../core";
import { BattleCry, BATTLE_CRY_ID } from "./battle-cry";
import { Guard, GUARD_ID } from "./guard";
import { HeavyStrike, HEAVY_STRIKE_ID } from "./heavy-strike";
import { Laceration, LACERATION_ID } from "./laceration";
import { Recover, RECOVER_ID } from "./recover";
import { Slash, SLASH_ID } from "./slash";

export const STARTER_LOADOUT: CombatantLoadout = {
  cardDefinitionIds: [
    SLASH_ID,
    GUARD_ID,
    RECOVER_ID,
    HEAVY_STRIKE_ID,
    BATTLE_CRY_ID,
    LACERATION_ID,
  ],
};

export const STARTER_CARD_DEFINITIONS: ReadonlyMap<
  CardDefinitionId,
  CardDefinition
> = new Map([
  [SLASH_ID, Slash],
  [GUARD_ID, Guard],
  [RECOVER_ID, Recover],
  [HEAVY_STRIKE_ID, HeavyStrike],
  [BATTLE_CRY_ID, BattleCry],
  [LACERATION_ID, Laceration],
]);
