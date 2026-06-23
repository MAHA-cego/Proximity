"use client";

import { TITLE_ILLUSTRATION_SRC } from "@/lib/illustrations";

export function TitleIllustration() {
  return (
    <div className="border-border bg-surface relative h-56 w-40 overflow-hidden border">
      <img
        src={TITLE_ILLUSTRATION_SRC}
        alt="Proximity"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
