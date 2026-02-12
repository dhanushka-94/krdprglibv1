"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
const SKIP_SECONDS = 10;

function formatTime(seconds: number) {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface AudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  compact?: boolean;
  /** Enable enhanced controls: speed, skip, keyboard shortcuts. Default true for full layout. */
  enhanced?: boolean;
}

export function AudioPlayer({ src, className, autoPlay, compact, enhanced = !compact }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSeekingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1); // 1x default

  const playbackRate = PLAYBACK_SPEEDS[speedIndex];

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoadedMetadata = () => {
      setDuration(el.duration);
      setLoading(false);
    };
    const onTimeUpdate = () => {
      if (!isSeekingRef.current) setCurrentTime(el.currentTime);
    };
    const onSeeked = () => {
      isSeekingRef.current = false;
      setCurrentTime(el.currentTime);
    };
    const onEnded = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      setError(true);
      setLoading(false);
    };

    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("seeked", onSeeked);
    el.addEventListener("ended", onEnded);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onError);

    return () => {
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("seeked", onSeeked);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onError);
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play();
  }, [playing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enhanced) return;
      const el = audioRef.current;
      if (!el) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          if (el.paused) el.play();
          else el.pause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          el.currentTime = Math.max(0, el.currentTime - SKIP_SECONDS);
          setCurrentTime(el.currentTime);
          break;
        case "ArrowRight":
          e.preventDefault();
          el.currentTime = Math.min(el.duration, el.currentTime + SKIP_SECONDS);
          setCurrentTime(el.currentTime);
          break;
        default:
          break;
      }
    },
    [enhanced]
  );

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || duration <= 0) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    el.currentTime = pct * duration;
    setCurrentTime(el.currentTime);
  };

  const toggleMute = () => {
    const el = audioRef.current;
    if (!el) return;
    if (muted) {
      el.muted = false;
      el.volume = volume;
      setMuted(false);
    } else {
      el.muted = true;
      setMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const v = parseFloat(e.target.value);
    setVolume(v);
    el.volume = v;
    if (v === 0) setMuted(true);
    else setMuted(false);
  };

  if (error) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive",
          className
        )}
      >
        Failed to load audio. Check the URL or try again.
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const newTime = parseFloat(e.target.value);
    if (!Number.isFinite(newTime) || newTime < 0) return;
    isSeekingRef.current = true;
    el.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (compact) {
    return (
      <div className={cn("flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3", className)}>
        <audio ref={audioRef} src={src} preload="metadata" autoPlay={autoPlay} className="hidden" />
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={togglePlay}
            disabled={loading}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-60 sm:size-9"
          >
            {loading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent sm:size-3.5" />
            ) : playing ? (
              <Pause className="size-5 shrink-0 fill-current sm:size-4" />
            ) : (
              <Play className="ml-0.5 size-5 shrink-0 fill-current sm:size-4" />
            )}
          </button>
          <div className="min-w-0 flex-1 space-y-1 sm:space-y-0.5">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeekInput}
              className="audio-seek w-full min-h-[20px] cursor-pointer touch-manipulation accent-primary sm:min-h-[16px]"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="tabular-nums">{formatTime(currentTime)}</span>
              <span className="tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleMute}
            className="shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground touch-manipulation sm:p-1.5"
          >
            {muted || volume === 0 ? (
              <VolumeX className="size-5 sm:size-3.5" />
            ) : (
              <Volume2 className="size-5 sm:size-3.5" />
            )}
          </button>
        </div>
      </div>
    );
  }

  const skipBack = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime - SKIP_SECONDS);
    setCurrentTime(el.currentTime);
  };

  const skipForward = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.min(el.duration || 0, el.currentTime + SKIP_SECONDS);
    setCurrentTime(el.currentTime);
  };

  const cycleSpeed = () => {
    setSpeedIndex((i) => (i + 1) % PLAYBACK_SPEEDS.length);
  };

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Audio player"
      tabIndex={enhanced ? 0 : undefined}
      onKeyDown={enhanced ? handleKeyDown : undefined}
      className={cn(
        "rounded-2xl bg-gradient-to-b from-muted/50 to-muted/30 p-5 shadow-sm ring-1 ring-border/50",
        enhanced && "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" autoPlay={autoPlay} className="hidden" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          {enhanced && (
            <button
              type="button"
              onClick={skipBack}
              disabled={loading}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label={`Rewind ${SKIP_SECONDS} seconds`}
            >
              <SkipBack className="size-5" />
            </button>
          )}
          <button
            type="button"
            onClick={togglePlay}
            disabled={loading}
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20 transition hover:scale-105 hover:ring-primary/30 disabled:opacity-60"
          >
            {loading ? (
              <span className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : playing ? (
              <Pause className="size-7" fill="currentColor" />
            ) : (
              <Play className="ml-1 size-7" fill="currentColor" />
            )}
          </button>
          {enhanced && (
            <button
              type="button"
              onClick={skipForward}
              disabled={loading}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label={`Forward ${SKIP_SECONDS} seconds`}
            >
              <SkipForward className="size-5" />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekInput}
            className="audio-seek audio-seek--full w-full min-h-[24px] cursor-pointer touch-manipulation accent-primary"
          />
          <div className="flex items-center justify-between gap-4">
            <span className="tabular-nums text-sm text-muted-foreground">
              {formatTime(currentTime)}
            </span>
            <span className="tabular-nums text-sm text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {enhanced && (
            <button
              type="button"
              onClick={cycleSpeed}
              className="flex h-9 min-w-[3rem] items-center justify-center rounded-lg bg-muted/60 px-2 text-xs font-medium text-foreground transition hover:bg-muted"
              title="Playback speed"
            >
              {playbackRate}x
            </button>
          )}
          <button
            type="button"
            onClick={toggleMute}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? (
              <VolumeX className="size-5" />
            ) : (
              <Volume2 className="size-5" />
            )}
          </button>
          <div className="hidden w-24 sm:block">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="h-1.5 w-full cursor-pointer rounded-full accent-primary"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
