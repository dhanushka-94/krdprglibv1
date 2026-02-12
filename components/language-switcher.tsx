"use client";

import { useLanguage } from "@/lib/language-context";
import type { Lang } from "@/lib/types";

const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "si", label: "සිං" },
  { value: "ta", label: "தமி" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <div className={`inline-flex items-center rounded-full border border-border/60 bg-muted/50 p-0.5 ${className ?? ""}`}>
      {LANGS.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => setLang(l.value)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
            lang === l.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
