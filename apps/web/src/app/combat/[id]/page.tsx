import { notFound } from "next/navigation";
import { ENCOUNTER_REGISTRY } from "@/lib/simulation/encounters";
import { CombatClient } from "./combat-client";

export default async function CombatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!ENCOUNTER_REGISTRY.has(id)) {
    notFound();
  }

  return <CombatClient encounterId={id} />;
}
