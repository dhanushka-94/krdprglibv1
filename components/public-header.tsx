"use client";

import Link from "next/link";
import { AuthButton } from "@/components/auth-button";

export function PublicHeader({ systemName, logoUrl }: { systemName?: string; logoUrl?: string }) {
  const name = (systemName && systemName.trim()) || "Television and Farm Broadcasting Service – All Radio Programmes Library";
  const hasLogo = Boolean(logoUrl?.trim());
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
          title={name}
        >
          {hasLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-auto max-w-[180px] shrink-0 object-contain"
            />
          )}
          <span className="truncate text-lg font-semibold tracking-tight text-foreground">
            {name}
          </span>
        </Link>
        <AuthButton />
      </div>
    </header>
  );
}
