import { Divider, Panel } from "@/components/ui";

export type PortraitFeedback = "damage" | "healing" | "defeated" | null;

interface PortraitCardProps {
  readonly name: string;
  readonly feedback?: PortraitFeedback;
  readonly feedbackKey?: string;
}

export function PortraitCard({
  name,
  feedback,
  feedbackKey,
}: PortraitCardProps) {
  return (
    <Panel>
      <div className="relative">
        {/* Placeholder artwork — replaced with illustration in production */}
        <div
          className={[
            "bg-surface-raised aspect-[3/4] w-full",
            feedback === "defeated"
              ? "grayscale transition-[filter] duration-1000"
              : "",
          ].join(" ")}
        />

        {feedback === "damage" && (
          <div
            key={feedbackKey}
            className="bg-crimson pointer-events-none absolute inset-0"
            style={{ animation: "flash-damage 800ms ease-out forwards" }}
          />
        )}

        {feedback === "healing" && (
          <div
            key={feedbackKey}
            className="bg-emerald pointer-events-none absolute inset-0"
            style={{ animation: "flash-heal 800ms ease-out forwards" }}
          />
        )}
      </div>
      <Divider />
      <div className="px-3 py-2.5">
        <p className="text-foreground font-mono text-sm">{name}</p>
      </div>
    </Panel>
  );
}
