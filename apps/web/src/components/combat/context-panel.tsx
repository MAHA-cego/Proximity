import {
  type CardDefinition,
  type CardDefinitionId,
} from "@proximity/simulation";
import { Stack } from "@/components/ui";
import { CardRules } from "./card-rules";

function formatCardName(id: CardDefinitionId): string {
  return String(id)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface ContextPanelProps {
  readonly cardDefinition: CardDefinition | null;
  readonly encounterName: string;
}

export function ContextPanel({
  cardDefinition,
  encounterName,
}: ContextPanelProps) {
  if (!cardDefinition) {
    return (
      <Stack gap={1}>
        <p className="text-muted text-xs tracking-[0.3em] uppercase">
          Encounter
        </p>
        <p className="text-foreground font-mono text-sm">{encounterName}</p>
      </Stack>
    );
  }

  const name = formatCardName(cardDefinition.id);
  const cooldownLabel =
    cardDefinition.cooldown === 0
      ? "No cooldown"
      : `Cooldown ${cardDefinition.cooldown}`;

  return (
    <Stack gap={3}>
      <Stack direction="row" align="center" justify="between">
        <p className="text-foreground font-mono text-sm">{name}</p>
        <p className="text-muted font-mono text-xs">{cooldownLabel}</p>
      </Stack>
      <CardRules definition={cardDefinition} />
    </Stack>
  );
}
