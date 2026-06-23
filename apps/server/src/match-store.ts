import type { CombatantId, MatchDefinition } from "@proximity/simulation";
import type {
  CreateMatchRequest,
  SerializedMatchDefinition,
} from "@proximity/protocol";
import { ServerMatch } from "./server-match.js";

const store = new Map<string, ServerMatch>();

export function createMatch(req: CreateMatchRequest): ServerMatch {
  const serializedDefinition: SerializedMatchDefinition = req.definition;

  const definition: MatchDefinition = {
    combatants: req.definition.combatants,
    cardDefinitions: new Map(req.definition.cardDefinitions),
  };

  const playerMap = new Map<string, CombatantId>(
    req.playerAssignments.map(({ playerId, combatantId }) => [
      playerId,
      combatantId,
    ]),
  );

  const match = new ServerMatch(
    req.matchId,
    definition,
    serializedDefinition,
    playerMap,
  );
  store.set(req.matchId, match);
  return match;
}

export function getMatch(matchId: string): ServerMatch | undefined {
  return store.get(matchId);
}
