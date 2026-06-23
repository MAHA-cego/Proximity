"use client";

import { useEffect, useRef, useState } from "react";

interface QuickMenuProps {
  readonly onLeave: () => void;
}

export function QuickMenu({ onLeave }: QuickMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="absolute right-4 bottom-4 z-20 flex flex-col items-end gap-2"
    >
      {open && (
        <div className="border-border bg-surface flex flex-col border">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="border-border text-muted hover:bg-surface-raised hover:text-foreground border-b px-6 py-3 text-left font-mono text-xs tracking-[0.3em] uppercase transition-colors duration-150"
          >
            Resume
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="text-muted hover:bg-surface-raised hover:text-foreground px-6 py-3 text-left font-mono text-xs tracking-[0.3em] uppercase transition-colors duration-150"
          >
            Return to Menu
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "border px-3 py-2 font-mono text-xs transition-colors duration-150",
          open
            ? "border-foreground text-foreground"
            : "border-border text-muted hover:border-foreground hover:text-foreground",
        ].join(" ")}
      >
        ···
      </button>
    </div>
  );
}
