import { notFound } from "next/navigation";
import { ENCOUNTER_REGISTRY } from "@/lib/simulation/encounters";
import { DeckClient } from "./deck-client";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!ENCOUNTER_REGISTRY.has(id)) {
    notFound();
  }

  return <DeckClient encounterId={id} />;
}
