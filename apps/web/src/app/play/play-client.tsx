"use client";

import { useRouter } from "next/navigation";
import { useProgression } from "@/lib/progression/progression-context";
import { encounterIllustrationSrc } from "@/lib/illustrations";
import {
  ENCOUNTER_ORDER,
  ENCOUNTER_REGISTRY,
} from "@/lib/simulation/encounters";

type EncounterStatus = "available" | "completed" | "locked";

interface EncounterCardProps {
  readonly id: string;
  readonly name: string;
  readonly status: EncounterStatus;
  readonly onSelect: () => void;
}

function EncounterCard({ id, name, status, onSelect }: EncounterCardProps) {
  const isLocked = status === "locked";

  const inner = (
    <>
      {/* Illustration */}
      <div className="relative flex-1 overflow-hidden">
        <div className="bg-surface-raised absolute inset-0" />
        <img
          src={encounterIllustrationSrc(id)}
          alt={name}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      {/* Name bar */}
      <div className="border-border flex h-8 shrink-0 items-center justify-between border-t px-3">
        <span
          className={[
            "truncate font-mono text-xs",
            isLocked ? "text-muted" : "text-foreground",
          ].join(" ")}
        >
          {name}
        </span>
        {status === "completed" && (
          <span className="text-emerald ml-2 shrink-0 font-mono text-xs">
            ✓
          </span>
        )}
      </div>
    </>
  );

  if (isLocked) {
    return (
      <div className="border-border bg-surface flex h-56 w-40 flex-col border opacity-50">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="border-border bg-surface flex h-56 w-40 cursor-pointer flex-col border transition-opacity duration-150 hover:opacity-80"
    >
      {inner}
    </button>
  );
}

export function PlayClient() {
  const router = useRouter();
  const { completedEncounterIds, availableEncounterIds } = useProgression();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center gap-12">
        {/* Adventure section */}
        <div className="flex flex-col gap-6">
          <p className="text-muted text-xs tracking-[0.3em] uppercase">
            Adventure
          </p>
          <div className="flex gap-3">
            {ENCOUNTER_ORDER.map((id) => {
              const encounter = ENCOUNTER_REGISTRY.get(id)!;
              const isCompleted = completedEncounterIds.has(id);
              const isAvailable = availableEncounterIds.has(id);
              const status: EncounterStatus = isCompleted
                ? "completed"
                : isAvailable
                  ? "available"
                  : "locked";

              return (
                <EncounterCard
                  key={id}
                  id={id}
                  name={encounter.name}
                  status={status}
                  onSelect={() => router.push(`/deck/${id}`)}
                />
              );
            })}
          </div>
        </div>

        {/* Multiplayer section */}
        <div className="flex w-80 flex-col gap-6">
          <p className="text-muted text-xs tracking-[0.3em] uppercase">
            Multiplayer
          </p>
          <div className="border-border border-t">
            <button
              type="button"
              onClick={() => router.push("/pvp/setup")}
              className="border-border hover:bg-surface-raised flex w-full cursor-pointer items-center justify-between border-b px-4 py-4 text-left transition-colors duration-150"
            >
              <span className="text-foreground font-mono text-sm">
                Local Versus
              </span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/multiplayer")}
              className="border-border hover:bg-surface-raised flex w-full cursor-pointer items-center justify-between border-b px-4 py-4 text-left transition-colors duration-150"
            >
              <span className="text-foreground font-mono text-sm">Online</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
