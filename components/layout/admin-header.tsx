"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { AuthButton } from "@/components/auth-button";
import { getAdminPath } from "@/lib/config";

const SYSTEM_NAME = "TFBS – All Radio Programmes Library";

export function AdminHeader({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="shrink-0 rounded p-2 hover:bg-accent md:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </button>
        )}
        <Link
          href={getAdminPath()}
          className="min-w-0 truncate font-semibold text-primary transition-colors hover:text-primary/90"
          title={SYSTEM_NAME}
        >
          {SYSTEM_NAME}
        </Link>
      </div>
      <div className="shrink-0">
        <AuthButton />
      </div>
    </header>
  );
}
