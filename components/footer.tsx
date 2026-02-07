"use client";

import { useEffect, useState } from "react";

const DEFAULT_CREDITS = "© {year} Television and Farm Broadcasting Service · Department of Agriculture, Sri Lanka";

export function Footer() {
  const year = new Date().getFullYear();
  const [credits, setCredits] = useState<string>(DEFAULT_CREDITS);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((data) => {
        const text = (data.footer_credits && data.footer_credits.trim()) || DEFAULT_CREDITS;
        setCredits(text.replace(/\{year\}/g, String(year)));
      })
      .catch(() => {});
  }, [year]);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 py-5 shadow-[0_-1px_0_0_var(--border)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center text-xs text-muted-foreground">
        {credits}
      </div>
    </footer>
  );
}
