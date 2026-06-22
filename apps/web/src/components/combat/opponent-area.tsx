import type { CombatantState } from "@proximity/simulation";
import { Stack } from "@/components/ui";
import { HealthBar } from "./health-bar";
import { ModifierBadge } from "./modifier-badge";
import { PortraitCard } from "./portrait-card";
import { StatusChip } from "./status-chip";

interface OpponentAreaProps {
  readonly name: string;
  readonly state: CombatantState;
}

export function OpponentArea({ name, state }: OpponentAreaProps) {
  return (
    <aside className="border-border w-64 shrink-0 overflow-hidden border-l">
      <Stack gap={4} className="p-5">
        <PortraitCard name={name} />
        <HealthBar current={state.health} max={state.combatant.maxHealth} />
        {state.statuses.length > 0 && (
          <Stack gap={1} direction="row" wrap>
            {state.statuses.map((status, i) => (
              <StatusChip key={i} status={status} />
            ))}
          </Stack>
        )}
        {state.modifiers.length > 0 && (
          <Stack gap={1} direction="row" wrap>
            {state.modifiers.map((modifier, i) => (
              <ModifierBadge key={i} modifier={modifier} />
            ))}
          </Stack>
        )}
      </Stack>
    </aside>
  );
}
