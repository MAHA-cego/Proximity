import type { MatchMetadata } from "./match-metadata";
import type { MatchStatus } from "./match-status";
import type { PlayerState } from "./player-state";
import type { TurnState } from "./turn-state";

export interface GameState {
  readonly metadata: MatchMetadata;

  readonly players: readonly PlayerState[];

  readonly turn: TurnState;

  readonly status: MatchStatus;

  readonly sequence: number;
}
