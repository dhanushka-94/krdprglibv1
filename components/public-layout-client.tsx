"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { NowPlayingProvider, useNowPlaying } from "@/lib/now-playing-context";
import { NowPlayingBar } from "@/components/now-playing-bar";

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
  faviconUrl,
}: {
  children: React.ReactNode;
  systemName: string;
  logoUrl: string;
  faviconUrl: string;
}) {
  useEffect(() => {
    if (!faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
    return () => {
      link?.remove();
    };
  }, [faviconUrl]);

  return (
    <NowPlayingProvider>
      <PublicLayoutInner systemName={systemName} logoUrl={logoUrl}>
        {children}
      </PublicLayoutInner>
    </NowPlayingProvider>
  );
}
