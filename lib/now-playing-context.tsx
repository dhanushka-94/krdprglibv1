"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export interface NowPlayingTrack {
  url: string;
  title: string;
  slug: string;
}

interface NowPlayingContextValue {
  current: NowPlayingTrack | null;
  play: (track: NowPlayingTrack) => void;
  clear: () => void;
}

const NowPlayingContext = createContext<NowPlayingContextValue | null>(null);

export function NowPlayingProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<NowPlayingTrack | null>(null);
  const play = useCallback((track: NowPlayingTrack) => {
    setCurrent(track);
  }, []);
  const clear = useCallback(() => setCurrent(null), []);
  return (
    <NowPlayingContext.Provider value={{ current, play, clear }}>
      {children}
    </NowPlayingContext.Provider>
  );
}

export function useNowPlaying() {
  const ctx = useContext(NowPlayingContext);
  if (!ctx) {
    return {
      current: null,
      play: (_: NowPlayingTrack) => {},
      clear: () => {},
    };
  }
  return ctx;
}
