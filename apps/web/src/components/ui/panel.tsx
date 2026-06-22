import { type ReactNode } from "react";

interface PanelProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function Panel({ children, className }: PanelProps) {
  const classes = ["bg-surface border border-border", className ?? ""]
    .join(" ")
    .trim();

  return <div className={classes}>{children}</div>;
}
