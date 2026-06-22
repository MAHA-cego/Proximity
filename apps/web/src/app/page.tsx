import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-foreground pl-[0.6em] text-5xl font-light tracking-[0.6em] uppercase">
            Proximity
          </h1>
          <p className="text-muted text-xs tracking-[0.25em] uppercase">
            Tactical Card Combat
          </p>
        </div>

        <div className="bg-border h-px w-8" />

        <Link
          href="/encounters"
          className="text-muted hover:text-foreground text-xs tracking-[0.3em] uppercase transition-colors duration-150"
        >
          Begin
        </Link>
      </div>
    </main>
  );
}
