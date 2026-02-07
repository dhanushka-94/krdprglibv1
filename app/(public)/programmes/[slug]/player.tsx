"use client";

import { AudioPlayer } from "@/components/audio-player";

export default function ProgrammePlayer({ url }: { url: string }) {
  return <AudioPlayer src={url} className="w-full" />;
}
