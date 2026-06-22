import {
  CORRUPTED_HUNTER_CARD_DEFINITIONS,
  CORRUPTED_HUNTER_ID,
  CorruptedHunterMatchCombatant,
  CORRUPTED_MILITIAMAN_CARD_DEFINITIONS,
  CORRUPTED_MILITIAMAN_ID,
  CorruptedMilitiamanMatchCombatant,
  CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS,
  CORRUPTED_SHEPHERDS_DOG_ID,
  CorruptedShepherdsDogMatchCombatant,
  type CardDefinition,
  type CardDefinitionId,
  type MatchCombatant,
} from "@proximity/simulation";
import {
  createCorruptedHunterAi,
  createCorruptedMilitiamanAi,
  createCorruptedShepherdsDogAi,
  type AiAgent,
} from "@proximity/ai";

export interface EncounterDefinition {
  readonly id: string;
  readonly name: string;
  readonly opponent: MatchCombatant;
  readonly cardDefinitions: ReadonlyMap<CardDefinitionId, CardDefinition>;
  readonly createAgent: () => AiAgent;
}

export const ENCOUNTER_REGISTRY: ReadonlyMap<string, EncounterDefinition> =
  new Map([
    [
      CORRUPTED_SHEPHERDS_DOG_ID,
      {
        id: CORRUPTED_SHEPHERDS_DOG_ID,
        name: "Corrupted Shepherd's Dog",
        opponent: CorruptedShepherdsDogMatchCombatant,
        cardDefinitions: CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS,
        createAgent: createCorruptedShepherdsDogAi,
      },
    ],
    [
      CORRUPTED_HUNTER_ID,
      {
        id: CORRUPTED_HUNTER_ID,
        name: "Corrupted Hunter",
        opponent: CorruptedHunterMatchCombatant,
        cardDefinitions: CORRUPTED_HUNTER_CARD_DEFINITIONS,
        createAgent: createCorruptedHunterAi,
      },
    ],
    [
      CORRUPTED_MILITIAMAN_ID,
      {
        id: CORRUPTED_MILITIAMAN_ID,
        name: "Corrupted Militiaman",
        opponent: CorruptedMilitiamanMatchCombatant,
        cardDefinitions: CORRUPTED_MILITIAMAN_CARD_DEFINITIONS,
        createAgent: createCorruptedMilitiamanAi,
      },
    ],
  ]);
