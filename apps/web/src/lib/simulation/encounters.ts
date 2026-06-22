import {
  CORRUPTED_HUNTER_CARD_DEFINITIONS,
  CORRUPTED_HUNTER_ID,
  CORRUPTED_HUNTER_UNLOCK_REWARDS,
  CorruptedHunterMatchCombatant,
  CORRUPTED_MILITIAMAN_CARD_DEFINITIONS,
  CORRUPTED_MILITIAMAN_ID,
  CORRUPTED_MILITIAMAN_UNLOCK_REWARDS,
  CorruptedMilitiamanMatchCombatant,
  CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS,
  CORRUPTED_SHEPHERDS_DOG_ID,
  CORRUPTED_SHEPHERDS_DOG_UNLOCK_REWARDS,
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
  readonly rewardCardIds: readonly CardDefinitionId[];
  readonly createAgent: () => AiAgent;
}

export const ENCOUNTER_ORDER: readonly string[] = [
  CORRUPTED_SHEPHERDS_DOG_ID,
  CORRUPTED_HUNTER_ID,
  CORRUPTED_MILITIAMAN_ID,
];

export const ENCOUNTER_REGISTRY: ReadonlyMap<string, EncounterDefinition> =
  new Map([
    [
      CORRUPTED_SHEPHERDS_DOG_ID,
      {
        id: CORRUPTED_SHEPHERDS_DOG_ID,
        name: "Corrupted Shepherd's Dog",
        opponent: CorruptedShepherdsDogMatchCombatant,
        cardDefinitions: CORRUPTED_SHEPHERDS_DOG_CARD_DEFINITIONS,
        rewardCardIds: CORRUPTED_SHEPHERDS_DOG_UNLOCK_REWARDS,
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
        rewardCardIds: CORRUPTED_HUNTER_UNLOCK_REWARDS,
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
        rewardCardIds: CORRUPTED_MILITIAMAN_UNLOCK_REWARDS,
        createAgent: createCorruptedMilitiamanAi,
      },
    ],
  ]);
