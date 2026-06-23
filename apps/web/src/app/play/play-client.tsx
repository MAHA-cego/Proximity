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
      {/* Name bar — grows to fit, centered */}
      <div className="border-border flex shrink-0 items-center justify-center gap-1.5 border-t px-3 py-2">
        <span
          className={[
            "text-center font-mono text-xs leading-tight",
            isLocked ? "text-muted" : "text-foreground",
          ].join(" ")}
        >
          {name}
        </span>
        {status === "completed" && (
          <span className="text-emerald shrink-0 font-mono text-xs">✓</span>
        )}
      </div>
    </>
  );

  if (isLocked) {
    return (
      <div className="border-border bg-surface flex aspect-[5/7] w-52 flex-col border opacity-50">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="border-border bg-surface flex aspect-[5/7] w-52 cursor-pointer flex-col border transition-opacity duration-150 hover:opacity-80"
    >
      {inner}
    </button>
  );
}

interface ModeCardProps {
  readonly label: string;
  readonly onSelect: () => void;
}

function ModeCard({ label, onSelect }: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="border-border bg-surface flex h-36 flex-1 cursor-pointer flex-col items-center justify-center border transition-opacity duration-150 hover:opacity-80"
    >
      <span className="text-foreground font-mono text-sm">{label}</span>
    </button>
  );
}

export function PlayClient() {
  const router = useRouter();
  const { completedEncounterIds, availableEncounterIds } = useProgression();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      {/* No items-center here — lets both sections stretch to the adventure row width */}
      <div className="flex flex-col gap-12">
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

        {/* Multiplayer section — row stretches to match adventure width */}
        <div className="flex flex-col gap-6">
          <p className="text-muted text-xs tracking-[0.3em] uppercase">
            Multiplayer
          </p>
          <div className="flex gap-3">
            <ModeCard
              label="Local Versus"
              onSelect={() => router.push("/pvp/setup")}
            />
            <ModeCard
              label="Online"
              onSelect={() => router.push("/multiplayer")}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
