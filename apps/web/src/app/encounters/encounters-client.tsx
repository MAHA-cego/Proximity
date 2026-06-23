"use client";

import { useRouter } from "next/navigation";
import { useProgression } from "@/lib/progression/progression-context";
import {
  ENCOUNTER_ORDER,
  ENCOUNTER_REGISTRY,
} from "@/lib/simulation/encounters";

interface EncounterRowProps {
  readonly name: string;
  readonly status: "available" | "completed" | "locked";
  readonly onSelect: () => void;
}

function EncounterRow({ name, status, onSelect }: EncounterRowProps) {
  const isLocked = status === "locked";

  const statusLabel =
    status === "completed" ? (
      <span className="text-emerald font-mono text-xs tracking-[0.3em] uppercase">
        Completed
      </span>
    ) : status === "locked" ? (
      <span className="text-muted font-mono text-xs tracking-[0.3em] uppercase">
        Locked
      </span>
    ) : null;

  const rowContent = (
    <>
      <span
        className={[
          "font-mono text-sm",
          isLocked ? "text-muted" : "text-foreground",
        ].join(" ")}
      >
        {name}
      </span>
      {statusLabel}
    </>
  );

  const rowClass =
    "border-border flex w-full items-center justify-between border-b py-4";

  if (isLocked) {
    return <div className={rowClass}>{rowContent}</div>;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        rowClass,
        "hover:bg-surface-raised cursor-pointer text-left transition-colors duration-150",
      ].join(" ")}
    >
      {rowContent}
    </button>
  );
}

export function EncountersClient() {
  const router = useRouter();
  const { completedEncounterIds, availableEncounterIds } = useProgression();

  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <div className="flex w-80 flex-col gap-8">
        <p className="text-muted text-xs tracking-[0.3em] uppercase">
          Encounters
        </p>
        <div className="border-border border-t">
          {ENCOUNTER_ORDER.map((id) => {
            const encounter = ENCOUNTER_REGISTRY.get(id)!;
            const isCompleted = completedEncounterIds.has(id);
            const isAvailable = availableEncounterIds.has(id);
            const status = isCompleted
              ? "completed"
              : isAvailable
                ? "available"
                : "locked";

            return (
              <EncounterRow
                key={id}
                name={encounter.name}
                status={status}
                onSelect={() => router.push(`/deck/${id}`)}
              />
            );
          })}
        </div>
        <p className="text-muted text-xs tracking-[0.3em] uppercase">
          Multiplayer
        </p>
        <div className="border-border border-t">
          <button
            type="button"
            onClick={() => router.push("/pvp/setup")}
            className="border-border hover:bg-surface-raised flex w-full cursor-pointer items-center justify-between border-b py-4 text-left transition-colors duration-150"
          >
            <span className="text-foreground font-mono text-sm">Local PvP</span>
          </button>
        </div>
      </div>
    </main>
  );
}
