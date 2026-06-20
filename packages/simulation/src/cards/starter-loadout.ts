import type { CardDefinition, CardDefinitionId, PlayerLoadout } from "../core";
import { AdrenalineRush, ADRENALINE_RUSH_ID } from "./adrenaline-rush";
import {
  EmergencyTreatment,
  EMERGENCY_TREATMENT_ID,
} from "./emergency-treatment";
import { FinishingBlow, FINISHING_BLOW_ID } from "./finishing-blow";
import { TacticalBurst, TACTICAL_BURST_ID } from "./tactical-burst";

export const STARTER_LOADOUT: PlayerLoadout = {
  cardDefinitionIds: [
    FINISHING_BLOW_ID,
    EMERGENCY_TREATMENT_ID,
    ADRENALINE_RUSH_ID,
    TACTICAL_BURST_ID,
  ],
};

export const STARTER_CARD_DEFINITIONS: ReadonlyMap<
  CardDefinitionId,
  CardDefinition
> = new Map([
  [FINISHING_BLOW_ID, FinishingBlow],
  [EMERGENCY_TREATMENT_ID, EmergencyTreatment],
  [ADRENALINE_RUSH_ID, AdrenalineRush],
  [TACTICAL_BURST_ID, TacticalBurst],
]);
