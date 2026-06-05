import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AuthTopBar() {
  return (
    <header className="docked full-width top-0 z-50 bg-surface shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-gutter-desktop">
        <Link
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition hover:bg-surface-container-highest hover:opacity-80 active:scale-95"
          href="/login"
        >
          <ArrowLeft size={22} strokeWidth={2.2} />
        </Link>
        <div className="font-headline-md text-headline-md font-bold text-primary">
          GlowManager
        </div>
        <div className="h-10 w-10" />
      </div>
    </header>
  );
}
