"use client";

interface CardIllustrationProps {
  readonly src: string;
  readonly alt?: string;
}

export function CardIllustration({ src, alt = "" }: CardIllustrationProps) {
  return (
    <div className="border-border relative h-20 w-full shrink-0 overflow-hidden border-b">
      <div className="bg-surface-raised absolute inset-0" />
      <img
        src={src}
        alt={alt}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
