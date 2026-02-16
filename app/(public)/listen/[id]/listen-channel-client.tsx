"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Radio, ArrowLeft, Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Channel {
  id: string;
  name: string;
  frequency: string | null;
  frequency_2: string | null;
  logo_url: string | null;
  stream_url: string;
  description: string | null;
}

export function ListenChannelClient({ channel }: { channel: Channel }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setError("Stream unavailable. The stream may be offline.");
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      setError(null);
      audio.play().catch(() => setError("Could not start stream."));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return (
    <div className="space-y-6">
      <Link
        href="/listen"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to all streams
      </Link>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
          {channel.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channel.logo_url}
              alt=""
              className="h-24 w-24 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Radio className="size-12" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{channel.name}</h1>
            {[channel.frequency, channel.frequency_2].filter(Boolean).length > 0 && (
              <p className="mt-1 text-muted-foreground">
                {[channel.frequency, channel.frequency_2].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">Live stream</p>
            {channel.description?.trim() && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {channel.description.trim()}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border/60 bg-muted/30 px-6 py-5">
          <audio ref={audioRef} src={channel.stream_url} preload="none" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Button
              size="lg"
              onClick={togglePlay}
              className="shrink-0 gap-2"
            >
              {playing ? (
                <>
                  <Pause className="size-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="size-5" />
                  Play Live
                </>
              )}
            </Button>
            <div className="flex items-center gap-3">
              <Volume2 className="size-5 shrink-0 text-muted-foreground" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="h-2 w-24 cursor-pointer appearance-none rounded-full bg-muted accent-primary sm:w-32"
              />
            </div>
          </div>
          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
