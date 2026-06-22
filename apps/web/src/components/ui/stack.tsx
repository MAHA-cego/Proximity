import { type ReactNode } from "react";

type GapValue = 0 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8;

const GAP: Record<GapValue, string> = {
  0: "gap-0",
  1: "gap-1",
  1.5: "gap-1.5",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
};

const ALIGN: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const JUSTIFY: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

interface StackProps {
  readonly direction?: "col" | "row";
  readonly gap?: GapValue;
  readonly align?: "center" | "end" | "start" | "stretch";
  readonly justify?: "between" | "center" | "end" | "start";
  readonly wrap?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Stack({
  direction = "col",
  gap = 0,
  align,
  justify,
  wrap = false,
  className,
  children,
}: StackProps) {
  const classes = [
    "flex",
    direction === "col" ? "flex-col" : "flex-row",
    GAP[gap],
    align ? ALIGN[align] : null,
    justify ? JUSTIFY[justify] : null,
    wrap ? "flex-wrap" : null,
    className ?? null,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
