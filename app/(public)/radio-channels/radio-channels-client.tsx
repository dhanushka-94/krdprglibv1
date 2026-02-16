"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, Headphones, List } from "lucide-react";
import type { RadioChannel } from "@/lib/types";

export function RadioChannelsPageClient() {
  const [channels, setChannels] = useState<RadioChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/radio-channels")
      .then((r) => r.json())
      .then((d) => setChannels(Array.isArray(d) ? d : []))
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Radio className="size-7" />
          Radio Channels
        </h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted/50" />
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
          Radio Channels
        </h1>
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
          <Radio className="mx-auto size-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            No radio channels yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Radio className="size-7" />
        Radio Channels
      </h1>
      <p className="text-muted-foreground">
        Browse all broadcast channels. Listen live or view programmes by channel.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="flex flex-col rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-primary/30"
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
                <p className="font-semibold text-foreground">{ch.name}</p>
                {[ch.frequency, ch.frequency_2].filter(Boolean).length > 0 && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[ch.frequency, ch.frequency_2].filter(Boolean).join(" · ")}
                  </p>
                )}
                {ch.description?.trim() && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {ch.description.trim()}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {ch.stream_url?.trim() && (
                <Link
                  href={`/listen/${ch.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Headphones className="size-4" />
                  Listen Live
                </Link>
              )}
              <Link
                href={`/?radio_channel_id=${ch.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <List className="size-4" />
                View Programmes
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
