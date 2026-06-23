import type { AiAgent } from "@proximity/ai";
import {
  CombatantControlType,
  Team,
  type CardDefinition,
  type CardDefinitionId,
  type CombatantDefinition,
  type CombatantId,
  type CombatantLoadout,
  type MatchDefinition,
} from "@proximity/simulation";
import type { EncounterDefinition } from "./encounters";

export type ActionProvider =
  | { readonly type: "human" }
  | { readonly type: "ai"; readonly agent: AiAgent }
  | {
      readonly type: "network";
      readonly serverUrl: string;
      readonly matchId: string;
      readonly playerId: string;
    };

export const PLAYER_COMBATANT_ID = "player" as CombatantId;
export const PLAYER_2_COMBATANT_ID = "player-2" as CombatantId;

export interface MatchParticipant {
  readonly combatant: CombatantDefinition;
  readonly displayName: string;
  readonly loadout: CombatantLoadout;
  readonly provider: ActionProvider;
}

export function createLocalPlayerParticipant(
  loadout: CombatantLoadout,
  displayName = "Player",
): MatchParticipant {
  return {
    combatant: {
      id: PLAYER_COMBATANT_ID,
      team: Team.One,
      maxHealth: 100,
      controlType: CombatantControlType.Human,
    },
    displayName,
    loadout,
    provider: { type: "human" },
  };
}

export function createLocalPlayer2Participant(
  loadout: CombatantLoadout,
  displayName = "Player 2",
): MatchParticipant {
  return {
    combatant: {
      id: PLAYER_2_COMBATANT_ID,
      team: Team.Two,
      maxHealth: 100,
      controlType: CombatantControlType.Human,
    },
    displayName,
    loadout,
    provider: { type: "human" },
  };
}

export function createEncounterParticipant(
  encounter: EncounterDefinition,
): MatchParticipant {
  return {
    combatant: encounter.opponent.combatant,
    displayName: encounter.name,
    loadout: encounter.opponent.loadout,
    provider: { type: "ai", agent: encounter.createAgent() },
  };
}

export function createMatchDefinition(
  participants: readonly [MatchParticipant, MatchParticipant],
  cardDefinitions: ReadonlyMap<CardDefinitionId, CardDefinition>,
): MatchDefinition {
  return {
    combatants: participants.map((p) => ({
      combatant: p.combatant,
      loadout: p.loadout,
    })),
    cardDefinitions,
  };
}
