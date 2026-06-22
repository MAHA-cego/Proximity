import { type ReactNode } from "react";
import { Stack } from "./stack";

interface SectionProps {
  readonly label: string;
  readonly gap?: 2 | 3 | 4;
  readonly className?: string;
  readonly children?: ReactNode;
}

export function Section({ label, gap = 3, className, children }: SectionProps) {
  return (
    <Stack gap={gap} className={className}>
      <p className="text-muted text-xs tracking-[0.3em] uppercase">{label}</p>
      {children}
    </Stack>
  );
}
