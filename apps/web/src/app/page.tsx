import Link from "next/link";
import { TitleIllustration } from "./title-illustration";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center">
        <TitleIllustration />

        <div className="flex flex-col items-center gap-3">
          <h1 className="text-foreground pl-[0.6em] text-5xl font-light tracking-[0.6em] uppercase">
            Proximity
          </h1>
          <p className="text-muted text-xs tracking-[0.25em] uppercase">Demo</p>
        </div>

        <div className="bg-border h-px w-8" />

        <Link
          href="/play"
          className="text-muted hover:text-foreground text-xs tracking-[0.3em] uppercase transition-colors duration-150"
        >
          Begin
        </Link>
      </div>
    </main>
  );
}
