import * as sim from "@proximity/simulation";
import type { CardDefinition, CardDefinitionId } from "@proximity/simulation";

function isCardDefinition(val: unknown): val is CardDefinition {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return (
    typeof obj["id"] === "string" &&
    typeof obj["cooldown"] === "number" &&
    Array.isArray(obj["abilities"])
  );
}

export const CARD_REGISTRY: ReadonlyMap<CardDefinitionId, CardDefinition> =
  new Map(
    (Object.values(sim as unknown as Record<string, unknown>) as unknown[])
      .filter(isCardDefinition)
      .map((card) => [card.id, card]),
  );
