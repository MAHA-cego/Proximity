import { Suspense } from "react";
import { PvpCombatClient } from "./pvp-combat-client";

export default function PvpCombatPage() {
  return (
    <Suspense>
      <PvpCombatClient />
    </Suspense>
  );
}
