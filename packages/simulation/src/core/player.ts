import type { CombatantControlType } from "./combatant-control-type";
import type { CombatantId } from "./ids";
import { Team } from "./team";

export interface CombatantDefinition {
  readonly id: CombatantId;
  readonly team: Team;
  readonly maxHealth: number;
  readonly controlType?: CombatantControlType;
}
