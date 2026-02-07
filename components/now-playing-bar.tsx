"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/audio-player";
import { useNowPlaying } from "@/lib/now-playing-context";

export function NowPlayingBar() {
  const { current, clear } = useNowPlaying();

  if (!current) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
        <div className="flex min-w-0 items-center justify-between gap-2 sm:flex-1">
          <Link
            href={`/programmes/${current.slug}`}
            className="min-w-0 truncate text-sm font-medium text-foreground hover:text-primary"
          >
            {current.title}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 sm:size-8"
            onClick={clear}
            aria-label="Close player"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex min-w-0 flex-1 basis-0 items-center gap-2 sm:flex-[2] sm:max-w-xl sm:gap-3">
          <AudioPlayer
            src={current.url}
            autoPlay
            className="!border-0 !bg-transparent !p-0 w-full"
            compact
          />
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block sm:max-w-[8rem] sm:flex-none">Now playing</p>
      </div>
    </div>
  );
}
