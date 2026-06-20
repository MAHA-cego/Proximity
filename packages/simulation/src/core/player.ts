import type { PlayerId } from "./ids";
import { Team } from "./team";

export interface Player {
  readonly id: PlayerId;
  readonly team: Team;
  readonly maxHealth: number;
}
