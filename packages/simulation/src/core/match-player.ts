import type { CombatantLoadout } from "./player-loadout";
import type { CombatantDefinition } from "./player";

export interface MatchCombatant {
  readonly combatant: CombatantDefinition;

  readonly loadout: CombatantLoadout;
}
