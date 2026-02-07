"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { AuthButton } from "@/components/auth-button";
import { getAdminPath } from "@/lib/config";

const FALLBACK_NAME = "TFBS – All Radio Programmes Library";

export function AdminHeader({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const [systemName, setSystemName] = useState(FALLBACK_NAME);
  const [logoUrl, setLogoUrl] = useState<string>("");

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.system_name !== undefined && String(data.system_name).trim())
          setSystemName(String(data.system_name).trim());
        if (data?.logo_url !== undefined) setLogoUrl(String(data.logo_url || "").trim());
      })
      .catch(() => {});
  }, []);

  const name = systemName || FALLBACK_NAME;

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
          className="flex min-w-0 items-center gap-2 font-semibold text-primary transition-colors hover:text-primary/90"
          title={name}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-auto max-w-[140px] shrink-0 object-contain"
            />
          ) : null}
          <span className="min-w-0 truncate">{name}</span>
        </Link>
      </div>
      <div className="shrink-0">
        <AuthButton />
      </div>
    </header>
  );
}
