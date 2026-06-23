import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  CombatantId,
  GameEvent,
  GameState,
  MatchCombatant,
} from "@proximity/simulation";

export type ClientMessage =
  | { readonly type: "use-card"; readonly cardInstanceId: CardInstanceId }
  | { readonly type: "end-turn" }
  | { readonly type: "concede" }
  | { readonly type: "request-rematch" };

export type ServerMessage =
  | {
      readonly type: "match-state";
      readonly state: GameState;
      readonly yourCombatantId: CombatantId;
      readonly definition: SerializedMatchDefinition;
    }
  | {
      readonly type: "events";
      readonly events: readonly GameEvent[];
      readonly state: GameState;
    }
  | { readonly type: "error"; readonly code: string; readonly message: string }
  | { readonly type: "opponent-disconnected" }
  | { readonly type: "opponent-reconnected" }
  | { readonly type: "match-abandoned" }
  | { readonly type: "rematch-available"; readonly code: string };

export interface SerializedMatchDefinition {
  readonly combatants: readonly MatchCombatant[];
  readonly cardDefinitions: ReadonlyArray<
    readonly [CardDefinitionId, CardDefinition]
  >;
}

export interface CreateMatchRequest {
  readonly matchId: string;
  readonly playerAssignments: ReadonlyArray<{
    readonly playerId: string;
    readonly combatantId: CombatantId;
  }>;
  readonly definition: SerializedMatchDefinition;
}
