"use client";

import { usePathname } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { NowPlayingProvider, useNowPlaying } from "@/lib/now-playing-context";
import { NowPlayingBar } from "@/components/now-playing-bar";
import { LanguageProvider } from "@/lib/language-context";

const LOGIN_PATH = "/login";

function PublicLayoutInner({
  children,
  systemName,
  logoUrl,
}: {
  children: React.ReactNode;
  systemName: string;
  logoUrl: string;
}) {
  const pathname = usePathname();
  const { current } = useNowPlaying();
  const isLoginPage = pathname === LOGIN_PATH;
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!isLoginPage && (
        <PublicHeader systemName={systemName} logoUrl={logoUrl} />
      )}
      <main
        className={`flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 ${current ? "pb-24" : ""}`}
      >
        {children}
      </main>
      <NowPlayingBar />
    </div>
  );
}

export function PublicLayoutClient({
  children,
  systemName,
  logoUrl,
}: {
  children: React.ReactNode;
  systemName: string;
  logoUrl: string;
}) {
  return (
    <LanguageProvider>
      <NowPlayingProvider>
        <PublicLayoutInner systemName={systemName} logoUrl={logoUrl}>
          {children}
        </PublicLayoutInner>
      </NowPlayingProvider>
    </LanguageProvider>
  );
}
