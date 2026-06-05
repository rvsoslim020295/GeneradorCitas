import Link from "next/link";

export function AuthFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="mt-auto flex w-full flex-col items-center justify-between gap-base border-t border-outline-variant bg-surface px-margin-page py-stack-lg md:flex-row">
      {compact ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          © 2024 GlowManager Professional. All rights reserved.
        </p>
      ) : (
        <div className="font-headline-sm text-headline-sm font-semibold text-on-surface opacity-50">
          GlowManager
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-base md:gap-stack-lg">
        <Link
          className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
          href="#"
        >
          Privacy Policy
        </Link>
        <Link
          className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
          href="#"
        >
          Terms of Service
        </Link>
        <Link
          className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
          href="#"
        >
          Support
        </Link>
      </div>
      {!compact ? (
        <div className="text-center font-body-md text-sm text-on-surface-variant md:text-right">
          © 2024 GlowManager Professional. All rights reserved.
        </div>
      ) : null}
    </footer>
  );
}
