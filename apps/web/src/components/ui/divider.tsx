interface DividerProps {
  readonly className?: string;
}

export function Divider({ className }: DividerProps) {
  const classes = ["border-t border-border", className ?? ""].join(" ").trim();

  return <hr className={classes} />;
}
