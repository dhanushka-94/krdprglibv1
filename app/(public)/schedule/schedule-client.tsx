"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, ArrowLeft } from "lucide-react";
import type { RadioChannel } from "@/lib/types";

type ScheduleItem = {
  id: string;
  category_id: string;
  radio_channel_id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_daily: boolean;
  category?: { id: string; name: string; slug: string };
  radio_channel?: { id: string; name: string; frequency?: string; frequency_2?: string; logo_url?: string };
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = parseInt(h ?? "0", 10);
  const mm = (m ?? "00").slice(0, 2);
  return `${hh}:${mm}`;
}

type CellSlot = { time: string; channel: string };

function buildGrid(
  schedules: ScheduleItem[]
): { categoryId: string; categoryName: string; slug?: string; days: CellSlot[][] }[] {
  const byCategory = schedules.reduce<Record<string, ScheduleItem[]>>((acc, s) => {
    if (!acc[s.category_id]) acc[s.category_id] = [];
    acc[s.category_id].push(s);
    return acc;
  }, {});

  return Object.entries(byCategory)
    .map(([categoryId, slots]) => {
      const days: CellSlot[][] = [[], [], [], [], [], [], []];
      const cat = slots[0]?.category as { name?: string; slug?: string } | undefined;

      for (const s of slots) {
        const time = `${formatTime(s.start_time)}–${formatTime(s.end_time)}`;
        const channel = (s.radio_channel as { name?: string })?.name ?? "Channel";
        const entry: CellSlot = { time, channel };

        if (s.is_daily) {
          for (let d = 0; d < 7; d++) days[d].push(entry);
        } else {
          const d = s.day_of_week ?? 0;
          days[d].push(entry);
        }
      }

      return {
        categoryId,
        categoryName: cat?.name ?? "Programme",
        slug: cat?.slug,
        days,
      };
    })
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
}

export function SchedulePageClient() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [channels, setChannels] = useState<RadioChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/radio-channels")
      .then((r) => r.json())
      .then((d) => setChannels(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (channelFilter !== "all") params.set("radio_channel_id", channelFilter);
    fetch(`/api/category-schedules?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setSchedules(Array.isArray(d) ? d : []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, [channelFilter]);

  const grid = buildGrid(schedules);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to all programmes
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <CalendarClock className="size-7" />
          Broadcast Schedule
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Weekly schedule – when each programme category airs
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Channel:</span>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              {channels.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>
                  {ch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-muted-foreground">Loading schedule...</p>
      ) : grid.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No schedule found for the selected channel.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Programme
                </th>
                {DAYS.map((d) => (
                  <th
                    key={d}
                    className="px-3 py-3 text-center font-semibold text-foreground min-w-[80px]"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row) => (
                <tr
                  key={row.categoryId}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground align-top">
                    <Link
                      href={`/?category_id=${row.categoryId}`}
                      className="hover:text-primary hover:underline"
                    >
                      {row.categoryName}
                    </Link>
                  </td>
                  {row.days.map((cell, i) => (
                    <td
                      key={i}
                      className="px-3 py-3 text-center text-muted-foreground align-top min-w-[80px]"
                    >
                      {cell.length === 0 ? (
                        <span className="text-muted-foreground/50">–</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {cell.map((s, j) => (
                            <span
                              key={j}
                              className="text-foreground text-xs"
                              title={s.channel}
                            >
                              {s.time}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
