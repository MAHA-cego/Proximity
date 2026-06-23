import { Suspense } from "react";
import { NetworkCombatClient } from "./network-combat-client";

export default function MultiplayerCombatPage() {
  return (
    <Suspense>
      <NetworkCombatClient />
    </Suspense>
  );
}
