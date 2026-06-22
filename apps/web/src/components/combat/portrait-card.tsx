import { Divider, Panel } from "@/components/ui";

interface PortraitCardProps {
  readonly name: string;
}

export function PortraitCard({ name }: PortraitCardProps) {
  return (
    <Panel>
      {/* Placeholder artwork — replaced with illustration in production */}
      <div className="bg-surface-raised aspect-[3/4] w-full" />
      <Divider />
      <div className="px-3 py-2.5">
        <p className="text-foreground font-mono text-sm">{name}</p>
      </div>
    </Panel>
  );
}
