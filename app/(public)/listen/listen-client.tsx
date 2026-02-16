"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, Headphones } from "lucide-react";
import type { RadioChannel } from "@/lib/types";

export function ListenPageClient() {
  const [channels, setChannels] = useState<RadioChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/radio-channels")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setChannels(list.filter((c: RadioChannel) => c.stream_url?.trim()));
      })
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Radio className="size-7" />
          Listen Live
        </h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Radio className="size-7" />
          Listen Live
        </h1>
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
          <Headphones className="mx-auto size-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            No radio streams available yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Stream URLs can be added by administrators in the radio channels settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Radio className="size-7" />
        Listen Live
      </h1>
      <p className="text-muted-foreground">
        Select a channel to listen to the live stream.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((ch) => (
          <Link
            key={ch.id}
            href={`/listen/${ch.id}`}
            className="group flex flex-col rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/20"
          >
            <div className="flex items-start gap-4">
              {ch.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ch.logo_url}
                  alt=""
                  className="size-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Radio className="size-7" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground group-hover:text-primary">
                  {ch.name}
                </p>
                {[ch.frequency, ch.frequency_2].filter(Boolean).length > 0 && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[ch.frequency, ch.frequency_2].filter(Boolean).join(" · ")}
                  </p>
                )}
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  <Headphones className="size-4" />
                  Listen now →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
