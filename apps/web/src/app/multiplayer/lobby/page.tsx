import { Suspense } from "react";
import { LobbyClient } from "./lobby-client";

export default function LobbyPage() {
  return (
    <Suspense>
      <LobbyClient />
    </Suspense>
  );
}
